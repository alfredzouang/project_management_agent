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

    builder.on_input_event(ProjectKickStartProcessEvents.StartProcess).send_event_to(target=create_task, parameter_name="project", function_name=CreateProjectTaskStep.Functions.CREATE_TASK.value)
    create_task.on_event(CreateProjectTaskStep.OutputEvents.TASK_CREATED).send_event_to(target=review_task, parameter_name="payload")
    create_task.on_event(CreateProjectTaskStep.OutputEvents.TASK_REVISED).send_event_to(target=review_task, parameter_name="payload")
    review_task.on_event(ReviewTaskStep.OutputEvents.TASK_NEEDS_REVISION).send_event_to(target=create_task, parameter_name="payload", function_name=CreateProjectTaskStep.Functions.REVISE_TASK.value)
    review_task.on_event(ReviewTaskStep.OutputEvents.TASK_REVIEW_PASSED).send_event_to(target=generate_output, parameter_name="payload")

    return builder.build()


