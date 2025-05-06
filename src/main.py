from lib.sample_lib import lib_function
from utils.sample_utils import utils_function
from plugins.light_plugins import LightsPlugin
from plugins.custom_plugin.custom_plugin import CustomPlugin
from agents.sample_agents import agents_function

import asyncio
import logging
from semantic_kernel import Kernel
from semantic_kernel.utils.logging import setup_logging
from semantic_kernel.functions import kernel_function
from semantic_kernel.connectors.ai.open_ai import AzureChatCompletion
from semantic_kernel.connectors.ai.function_choice_behavior import FunctionChoiceBehavior
from semantic_kernel.connectors.ai.chat_completion_client_base import ChatCompletionClientBase
from semantic_kernel.contents.chat_history import ChatHistory
from semantic_kernel.functions.kernel_arguments import KernelArguments
import os
import sys

import semantic_kernel as sk
import semantic_kernel.connectors.ai.open_ai as skaoai
from semantic_kernel.connectors.ai.open_ai import AzureChatPromptExecutionSettings, OpenAIChatPromptExecutionSettings
from semantic_kernel.prompt_template import InputVariable, PromptTemplateConfig
from semantic_kernel.planners import SequentialPlanner

from semantic_kernel.connectors.ai.open_ai.prompt_execution_settings.azure_chat_prompt_execution_settings import (
    AzureChatPromptExecutionSettings,
)

import os
from dotenv import load_dotenv

load_dotenv(override=True)

# Set the logging level for  semantic_kernel.kernel to DEBUG.
logging.basicConfig(
    format="[%(asctime)s - %(name)s:%(lineno)d - %(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logging.getLogger("kernel").setLevel(logging.DEBUG)

AZURE_OPENAI_API_KEY = os.getenv("AZURE_OPENAI_API_KEY")
AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
AZURE_OPENAI_API_VERSION = os.getenv("AZURE_OPENAI_API_VERSION")
AZURE_OPENAI_API_MODEL = os.getenv("AZURE_OPENAI_API_MODEL")

base_plugin_path = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "plugins")

async def main():
    # Initialize the kexrnel
    service_id="azure-openai"
    kernel = Kernel()
    kernel.add_service(AzureChatCompletion(
        deployment_name=AZURE_OPENAI_API_MODEL,
        api_key=AZURE_OPENAI_API_KEY,
        base_url=AZURE_OPENAI_ENDPOINT,
        endpoint=AZURE_OPENAI_ENDPOINT,
        api_version=AZURE_OPENAI_API_VERSION,
        service_id=service_id
    ))
    
    # Add Azure OpenAI chat completion
    # chat_completion = AzureChatCompletion(
    #     deployment_name=AZURE_OPENAI_API_MODEL,
    #     api_key=AZURE_OPENAI_API_KEY,
    #     base_url=AZURE_OPENAI_ENDPOINT,
    # )
    chat_completion : AzureChatCompletion = kernel.get_service(type=ChatCompletionClientBase)
    # kernel.add_service(chat_completion)

    # Set the logging level for  semantic_kernel.kernel to DEBUG.
    setup_logging()
    logging.getLogger("kernel").setLevel(logging.DEBUG)

    # Add a plugin (the LightsPlugin class is defined below)
    kernel.add_plugin(
        LightsPlugin(),
        plugin_name="Lights",
    )
    kernel.add_plugin(
        CustomPlugin(),
        plugin_name="CustomPlugin",
    )
    writer_plugin = kernel.add_plugin(parent_directory=base_plugin_path,plugin_name ="writer_plugin")
    email_plugin = kernel.add_plugin(parent_directory=base_plugin_path,plugin_name ="email_plugin")
    translate_plugin = kernel.add_plugin(parent_directory=base_plugin_path,plugin_name ="translate_plugin")
    planner = SequentialPlanner(kernel, service_id)
    # Enable planning
    execution_settings = AzureChatPromptExecutionSettings()
    execution_settings.function_choice_behavior = FunctionChoiceBehavior.Auto()

    # Create a history of the conversation
    # Create a history of the conversation
    history = ChatHistory()


    # Initiate a back-and-forth chat
    userInput = None
    while True:
        # Collect user input
        userInput = input("User > ")

        # Terminate the loop if the user says "exit"
        if userInput == "exit":
            break

        # Add user input to the history
        history.add_user_message(userInput)

        # Get the response from the AI
        # result = (await chat_completion.get_chat_message_contents(
        #     chat_history=history,
        #     settings=execution_settings,
        #     kernel=kernel,
        #     arguments=KernelArguments(),
        # ))[0]
        original_plan = await planner.create_plan(goal=userInput)
        for step in original_plan._steps:
            print(
                f"- {step.description.replace('.', '') if step.description else 'No description'} using {step.metadata.fully_qualified_name} with parameters: {step.parameters}"
            )
        result = await original_plan.invoke(kernel)

        # Print the results
        print("Assistant > " + str(result))

        # Add the message from the agent to the chat history
        history.add_message({
            "role": "assistant",
            "content": str(result),
        })

# Run the main function
if __name__ == "__main__":
    asyncio.run(main())
