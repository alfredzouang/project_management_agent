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
from processes.steps.generate_output_step import (GenerateOutputStep)
from processes.steps.review_task_step import ReviewTaskStep
from processes.steps.assign_resource_step import AssignResourceStep

class ProjectKickStartProcessEvents(str, Enum):
    StartProcess = "StartProcess"
    TaskCreated = "TaskCreated"
    TaskNeedsRevision = "TaskNeedsRevision"
    TaskReviewPassed = "TaskReviewPassed"
    OutputGenerated = "OutputGenerated"
    ProcessCompleted = "ProcessCompleted"
    ProcessFailed = "ProcessFailed"

def build_process() -> KernelProcess:
    builder = ProcessBuilder(name="ProjectKickStartProcess")

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


