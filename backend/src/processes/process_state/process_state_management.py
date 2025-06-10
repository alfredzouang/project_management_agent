from semantic_kernel.processes.kernel_process import KernelProcessStateMetadata
import json
from pathlib import Path

PROCESS_STATE_DIRECTORY = Path(__file__).resolve().parent.parent.parent.parent / "process_states"

PROCESS_STATE_DIRECTORY.mkdir(parents=True, exist_ok=True)

def dump_process_state_metadata_locally(process_state: KernelProcessStateMetadata, json_filename: str) -> None:
    """
    Saves the ProcessStateMetadata to a local JSON file in step03/processes_states,
    relative to the current script's grandparent folder.
    """
    file_path = PROCESS_STATE_DIRECTORY / json_filename
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(process_state.model_dump(exclude_none=True, by_alias=True, mode="json"), f, indent=4)
    print(f"Process state saved to '{file_path.resolve()}'")

def load_process_state_metadata(json_filename: str) -> KernelProcessStateMetadata | None:
    """
    Loads the ProcessStateMetadata from step03/processes_states if it exists.
    Returns None if the file doesn't exist or fails to parse.
    """
    file_path = PROCESS_STATE_DIRECTORY / json_filename
    if not file_path.exists():
        print(f"No such file: '{file_path.resolve()}'")
        return None

    try:
        with open(file_path, encoding="utf-8") as f:
            return KernelProcessStateMetadata.model_validate_json(f)
    except Exception as ex:
        print(f"Error reading state file '{file_path.resolve()}': {ex}")
        return None