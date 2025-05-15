# from semantic_kernel.skill_definition import sk_function, sk_function_context_parameter
from semantic_kernel import Kernel
from semantic_kernel.connectors.ai.chat_completion_client_base import \
    ChatCompletionClientBase
from semantic_kernel.connectors.ai.open_ai import \
    AzureChatPromptExecutionSettings
from semantic_kernel.contents import ChatHistory
from semantic_kernel.functions import kernel_function
from typing import Annotated

class MermaidPlugin:

    kernel: Kernel

    system_prompt = """
        # ROLE
            You are a senior developer and you are responsible for creating mermaid diagram based on the text.
            You will be provided with a text description.
        # INSTRUCTIONS
        1. You need to create a mermaid diagram based on the text description.
        2. The mermaid diagram should be in the following format:
        ```
        <mermaid_diagram>
        ```

        # SYNTAX

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
        """

    def __init__(self, kernel: Annotated[Kernel | None, "The kernel", {"include_in_function_choices": False}] = None):
        self.kernel = kernel

    @kernel_function(
        description="Create mermaid diagram based on the text",
        name="MermaidFunction"
    )
    async def create_mermaid_diagram(self, text: str) -> str:

        chat_service, settings = self.kernel.select_ai_service(
            type=ChatCompletionClientBase)
        assert isinstance(chat_service, ChatCompletionClientBase)
        assert isinstance(settings, AzureChatPromptExecutionSettings)
        settings.temperature = 0.0
        settings.max_tokens = 6000

        chat_history = ChatHistory(system_message=self.system_prompt)
        chat_history.add_user_message(text)

        response = await chat_service.get_chat_message_content(chat_history=chat_history, settings=settings)

        response: str = response.content
        if not response.startswith("```mermaid"):
            raise ValueError("The response is not a valid mermaid diagram.")
        if not response.endswith("```"):
            raise ValueError("The response is not a valid mermaid diagram.")

        return response
