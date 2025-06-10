import os
import logging
from typing import Optional, Callable, List

from semantic_kernel import Kernel
from semantic_kernel.connectors.ai.open_ai import AzureChatCompletion

def create_kernel(
    plugins: Optional[List[Callable[[Kernel], None]]] = None,
    logger: Optional[logging.Logger] = None
) -> Kernel:
    """
    Create and initialize a Kernel instance with AzureChatCompletion service.
    Optionally register plugins via the plugins parameter.

    Args:
        plugins: List of callables that accept a Kernel and register plugins.
        logger: Optional logger for error reporting.

    Returns:
        Kernel: The initialized Kernel instance.

    Raises:
        RuntimeError: If required environment variables are missing.
    """
    # Load environment variables
    AZURE_OPENAI_API_KEY = os.getenv("AZURE_OPENAI_API_KEY")
    AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
    AZURE_OPENAI_API_VERSION = os.getenv("AZURE_OPENAI_API_VERSION")
    AZURE_OPENAI_API_MODEL = os.getenv("AZURE_OPENAI_API_MODEL")
    service_id = "azure-openai"

    # Validate environment variables
    missing = [
        var for var, val in [
            ("AZURE_OPENAI_API_KEY", AZURE_OPENAI_API_KEY),
            ("AZURE_OPENAI_ENDPOINT", AZURE_OPENAI_ENDPOINT),
            ("AZURE_OPENAI_API_VERSION", AZURE_OPENAI_API_VERSION),
            ("AZURE_OPENAI_API_MODEL", AZURE_OPENAI_API_MODEL),
        ] if not val
    ]
    if missing:
        msg = f"Missing required environment variables: {', '.join(missing)}"
        if logger:
            logger.error(msg)
        raise RuntimeError(msg)

    kernel = Kernel()
    kernel.add_service(AzureChatCompletion(
        deployment_name=AZURE_OPENAI_API_MODEL,
        api_key=AZURE_OPENAI_API_KEY,
        base_url=AZURE_OPENAI_ENDPOINT,
        endpoint=AZURE_OPENAI_ENDPOINT,
        api_version=AZURE_OPENAI_API_VERSION,
        service_id=service_id
    ))

    # Register plugins if provided
    if plugins:
        for register in plugins:
            register(kernel)

    return kernel
