import os

import os
from enum import Enum

from dotenv import load_dotenv
from semantic_kernel import Kernel
from semantic_kernel.connectors.ai.open_ai import (
    AzureChatCompletion)
from semantic_kernel.processes import ProcessBuilder
from semantic_kernel.processes.kernel_process import (
    KernelProcess)

from processes.steps.create_task_step import CreateProjectTaskStep
from processes.steps.generate_output_step import GenerateOutputStep
from processes.steps.review_task_step import ReviewTaskStep
from processes.steps.assign_resource_step import AssignResourceStep

# --- ReportStateMixin for modular state reporting ---
class ReportStateMixin:
    """
    Mixin for process steps to report state updates.
    The callback (state_callback) should immediately flush any output or transport after sending a status update,
    e.g., call sys.stdout.flush() if writing to stdout, or flush the websocket/HTTP stream if using network transport.
    This ensures the UI receives updates in real time and not in batch.
    """
    _global_state_callback = None

    def __init__(self, *args, state_callback=None, **kwargs):
        super().__init__(*args, **kwargs)
        # Always use the class-level callback to avoid bound method issues
        if state_callback is not None:
            ReportStateMixin._global_state_callback = state_callback

    def _report_process_state(self, step_name: str, status: str, extra: dict = None):
        # Only report minimal, public-facing process state
        public_state = {}
        # Try to extract public fields from self.state if present
        if hasattr(self, "state") and self.state is not None:
            # Only include project, task_list, suggestion, need_revision, etc.
            for key in ["project", "task_list", "suggestion", "need_revision"]:
                value = getattr(self.state, key, None)
                if value is not None:
                    # Convert Pydantic models and lists of models to dicts
                    if hasattr(value, "model_dump"):
                        public_state[key] = value.model_dump()
                    elif isinstance(value, list) and value and hasattr(value[0], "model_dump"):
                        public_state[key] = [item.model_dump() for item in value]
                    else:
                        public_state[key] = value
        # Also merge in any extra fields (e.g., suggestions from review step)
        if extra:
            public_state.update(extra)
        state_info = {
            "step": step_name,
            "status": status,
            "state": public_state if public_state else None,
        }
        if ReportStateMixin._global_state_callback:
            # NOTE: The callback should flush its output/transport after this call for real-time UI updates.
            ReportStateMixin._global_state_callback(state_info)

# --- Factory to create step classes with reporting ---
from semantic_kernel.functions import kernel_function

def make_step_with_reporting(base_cls):
    class StepWithReporting(ReportStateMixin, base_cls):
        def __init__(self, *args, state_callback=None, **kwargs):
            super().__init__(*args, state_callback=state_callback, **kwargs)
    # Re-apply @kernel_function decorator to all kernel functions from base class
    if hasattr(base_cls, "__kernel_functions__"):
        for func_name, func in base_cls.__kernel_functions__.items():
            if hasattr(StepWithReporting, func_name):
                setattr(StepWithReporting, func_name, kernel_function(name=func_name)(getattr(StepWithReporting, func_name)))
        StepWithReporting.__kernel_functions__ = base_cls.__kernel_functions__
    return StepWithReporting

class ProjectKickStartProcessEvents(str, Enum):
    StartProcess = "StartProcess"
    TaskCreated = "TaskCreated"
    TaskNeedsRevision = "TaskNeedsRevision"
    TaskReviewPassed = "TaskReviewPassed"
    OutputGenerated = "OutputGenerated"
    ProcessCompleted = "ProcessCompleted"
    ProcessFailed = "ProcessFailed"

def build_process(state_callback=None) -> KernelProcess:
    builder = ProcessBuilder(name="ProjectKickStartProcess")

    # Set global callback for all steps
    ReportStateMixin._global_state_callback = state_callback

    # Monkey-patch _report_process_state on step classes to inject reporting
    def patched_report_process_state(self, step_name: str, status: str, extra: dict = None):
        public_state = {}
        if hasattr(self, "state") and self.state is not None:
            # Only include minimal, public-facing fields (exclude chat_history)
            for key in ["project", "task_list", "suggestion", "need_revision"]:
                value = getattr(self.state, key, None)
                if value is not None:
                    if hasattr(value, "model_dump"):
                        public_state[key] = value.model_dump()
                    elif isinstance(value, list) and value and hasattr(value[0], "model_dump"):
                        public_state[key] = [item.model_dump() for item in value]
                    else:
                        public_state[key] = value
        def to_serializable(obj):
            # Recursively convert Pydantic models and lists of models to dicts
            from pydantic import BaseModel
            if isinstance(obj, BaseModel):
                return obj.model_dump()
            elif isinstance(obj, dict):
                return {k: to_serializable(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [to_serializable(i) for i in obj]
            elif isinstance(obj, tuple):
                return tuple(to_serializable(i) for i in obj)
            else:
                return obj

        if extra:
            # Also exclude chat_history from extra if present
            if "chat_history" in extra:
                extra = {k: v for k, v in extra.items() if k != "chat_history"}
            # Recursively convert all values in extra to dicts if needed
            extra_serialized = {k: to_serializable(v) for k, v in extra.items()}
            public_state.update(extra_serialized)
        state_info = {
            "step": step_name,
            "status": status,
            "state": public_state if public_state else None,
        }
        if ReportStateMixin._global_state_callback:
            # Always send a dict, never a pre-serialized JSON string
            ReportStateMixin._global_state_callback(state_info)

    # Patch all relevant step classes
    for step_cls in [CreateProjectTaskStep, ReviewTaskStep, GenerateOutputStep, AssignResourceStep]:
        step_cls._report_process_state = patched_report_process_state

    # Use the base classes directly
    create_task = builder.add_step(CreateProjectTaskStep)
    review_task = builder.add_step(ReviewTaskStep)
    generate_output = builder.add_step(GenerateOutputStep)
    assign_resource = builder.add_step(AssignResourceStep)

    builder.on_input_event(ProjectKickStartProcessEvents.StartProcess).send_event_to(target=create_task, parameter_name="project", function_name=CreateProjectTaskStep.Functions.CREATE_TASK.value)
    create_task.on_event(CreateProjectTaskStep.OutputEvents.TASK_CREATED).send_event_to(target=review_task, parameter_name="payload")
    create_task.on_event(CreateProjectTaskStep.OutputEvents.TASK_REVISED).send_event_to(target=review_task, parameter_name="payload")
    review_task.on_event(ReviewTaskStep.OutputEvents.TASK_NEEDS_REVISION).send_event_to(target=create_task, parameter_name="payload", function_name=CreateProjectTaskStep.Functions.REVISE_TASK.value)
    review_task.on_event(ReviewTaskStep.OutputEvents.TASK_REVIEW_PASSED).send_event_to(target=assign_resource, parameter_name="payload", function_name=AssignResourceStep.Functions.ASSIGN_RESOURCE.value)
    assign_resource.on_event(AssignResourceStep.OutputEvents.RESOURCE_ASSIGNED).send_event_to(target=generate_output, parameter_name="payload", function_name=GenerateOutputStep.Functions.GENERATE_OUTPUT.value)
    generate_output.on_event(GenerateOutputStep.OutputEvents.OUTPUT_GENERATED).send_event_to(target=generate_output, parameter_name="payload", function_name=GenerateOutputStep.Functions.REVIEW_OUTPUT.value)
    generate_output.on_event(GenerateOutputStep.OutputEvents.OUTPUT_REJECTED).send_event_to(target=generate_output, parameter_name="payload", function_name=GenerateOutputStep.Functions.REVISE_OUTPUT.value)
    generate_output.on_event(GenerateOutputStep.OutputEvents.OUTPUT_REVISED).send_event_to(target=generate_output, parameter_name="payload", function_name=GenerateOutputStep.Functions.REVIEW_OUTPUT.value)

    return builder.build()
