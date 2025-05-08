import asyncio
from json import load
import json
import logging
from enum import Enum
from pyclbr import Class
from typing import ClassVar, List, Dict, Any, Optional, Union, Literal

from numpy import isin
from openai import project
from pydantic import BaseModel, Field

from semantic_kernel import Kernel
from semantic_kernel.contents import ChatHistory, ChatMessageContent
from semantic_kernel.core_plugins.time_plugin import TimePlugin
from semantic_kernel.agents import OpenAIResponsesAgent
from semantic_kernel.functions import kernel_function
from semantic_kernel.processes import ProcessBuilder
from semantic_kernel.processes.kernel_process import (
    KernelProcess,
    KernelProcessEvent,
    KernelProcessEventVisibility,
    KernelProcessStep,
    KernelProcessStepContext,
    KernelProcessStepState,
)
from semantic_kernel.processes.local_runtime.local_kernel_process import start as start_local_process
from semantic_kernel.connectors.ai.open_ai import AzureChatCompletion, AzureChatPromptExecutionSettings
from semantic_kernel.connectors.ai.chat_completion_client_base import ChatCompletionClientBase
from model.project_types import Project, ProjectTask, ProjectPlan, Resource, ProjectType


class GenerateOutputState(BaseModel):

    name : str = "GenerateOutputState"
    chat_history: ChatHistory | None = None
    task_list: List[ProjectTask] | None = None
    project: Project | None = None
    output: str | None = None


class GenerateOutputStep(KernelProcessStep[GenerateOutputState]):

    GENERATE_OUTPUT : ClassVar[str] = "GenerateOutputStep"

    state: GenerateOutputState = Field(default_factory=GenerateOutputState)

    class Functions(Enum):
        GENERATE_OUTPUT = "GenerateOutput"

    class OutputEvents(Enum):
        OUTPUT_GENERATED = "OutputGenerated"

    system_prompt: ClassVar[str] = """
    # ROLE
        You are a senior writer and you are responsible for generating output for a project.
        You will be provided with a project description and task list.
    
        # INSTRUCTIONS
        1. You will be provided with a project description and a list of tasks.
        2. You need to generate output for each task.
        3. Use markdown format for the output.
        4. The markdown should include the following sections:
        - Project Description
        - Task List Table
        - Task Gantt Diagram
        5. The task list table should have following columns:
        - id
        - name
        - description
        - outline_level
        - dependent_tasks
        - parent_task
        - child_tasks
        - status
        - estimated_effort_in_hours
        6. The task list gantt diagram should be in mermaid format.

        # MERMAID SYNTAX FOR GANTT DIAGRAM
        The following is the syntax for creating a gantt chart using mermaid:
        gantt
    dateFormat  YYYY-MM-DD
    title       Adding GANTT diagram functionality to mermaid
    excludes    weekends
    %% (`excludes` accepts specific dates in YYYY-MM-DD format, days of the week ("sunday") or "weekends", but not the word "weekdays".)

    section A section
    Completed task            :done,    des1, 2014-01-06,2014-01-08
    Active task               :active,  des2, 2014-01-09, 3d
    Future task               :         des3, after des2, 5d
    Future task2              :         des4, after des3, 5d

    section Critical tasks
    Completed task in the critical line :crit, done, 2014-01-06,24h
    Implement parser and jison          :crit, done, after des1, 2d
    Create tests for parser             :crit, active, 3d
    Future task in critical line        :crit, 5d
    Create tests for renderer           :2d
    Add to mermaid                      :until isadded
    Functionality added                 :milestone, isadded, 2014-01-25, 0d

    section Documentation
    Describe gantt syntax               :active, a1, after des1 des2, 3d
    Add gantt diagram to demo page      :after a1  , 20h
    Add another diagram to demo page    :doc1, after a1 a2 a3 , 48h

    section Last section
    Describe gantt syntax               :after doc1, 3d
    Add gantt diagram to demo page      :20h
    Add another diagram to demo page    :48h

    # OUTPUT FORMAT
    ** IMPORTANT: Use markdown format for the whole output. DO NOT OUTPUT AS A CODE BLOCK. **

        """

    async def activate(self, state: KernelProcessStepState[GenerateOutputState]):
        self.state = state.state
        if self.state.chat_history is None:
            self.state.chat_history = ChatHistory(
                system_message=self.system_prompt)

    @kernel_function(name=Functions.GENERATE_OUTPUT.value)
    async def generate_output(self, context: KernelProcessStepContext, payload: dict, kernel: Kernel):
        task_list = payload.get("task_list", [])
        project = payload.get("project", None)
        if not task_list or not project:
            raise ValueError("Task list and project are required.")
        self.state.task_list = task_list
        self.state.project = project
        self.state.chat_history.add_user_message(
            json.dumps({
                "task_list": task_list,
                "project": project
            })
        )
        chat_service, settings = kernel.select_ai_service(
            type=ChatCompletionClientBase)
        assert isinstance(chat_service, ChatCompletionClientBase)
        assert isinstance(settings, AzureChatPromptExecutionSettings)

        response = await chat_service.get_chat_message_content(chat_history=self.state.chat_history, settings=settings)

        response: str = response.content
        print(f"Markdown: {response}")
        with open('./output.md', 'w', encoding='utf-8') as f:
            f.write(response)
        f.close()
        self.state.output = response
        # return response
