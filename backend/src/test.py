import asyncio
import httpx
import json

# Input data for the /project/start endpoint
project_data = {
    "name": "Snake Eat Egg Project",
    "description": "This project aims to develop an interactive simulation that accurately models the process of a snake locating, consuming, and digesting an egg. The simulation will include realistic snake behavior, egg detection algorithms, and visual animations to demonstrate the biological process. The project is intended for use in educational settings to teach students about reptile feeding habits and digestive physiology, as well as for research purposes to study animal behavior in controlled environments.",
    "customer": "string",
    "estimated_start_date": "string",
    "estimated_finish_date": "string",
    "actual_start_date": "string",
    "actual_finish_date": "string",
    "estimated_effort_in_hours": 0,
    "effort_completed_in_hours": 0,
    "complete_percentage": 0,
    "estimated_total_cost": 0,
    "actual_total_cost": 0,
    "cost_consumption_percentage": 0,
    "project_type": "IDG - Bench Time (Non-billable)",
    "sow_expriation_date": "string",
    "kick_off_partner_completed_and_minutes_published_date": "string",
    "kick_off_internal_completed_and_minutes_published_date": "string",
    "kick_off_customer_completed_and_minutes_published_date": "string",
    "owner": "string",
    "project_manager": "string",
    "project_coordinator": "string",
    "solution_architect": "string",
    "client_name": "string",
    "client_phone": "string",
    "client_address": "string",
    "client_email": "string",
    "supplier_name": "string",
    "supplier_phone": "string",
    "supplier_address": "string",
    "supplier_email": "string"
}

STATUS_LOG_FILE = "status_updates.log"

def log_status(message):
    with open(STATUS_LOG_FILE, "a", encoding="utf-8") as f:
        f.write(message + "\n")

async def test_start_project():
    url = "http://localhost:8000/project/start"
    headers = {"Content-Type": "application/json"}
    async with httpx.AsyncClient(timeout=None) as client:
        async with client.stream("POST", url, headers=headers, json=project_data) as response:
            # log_status(f"Status code: {response.status_code}")
            # log_status(f"Content-Type: {response.headers.get('Content-Type')}")
            assert response.status_code == 200
            assert response.headers.get("Content-Type", "").startswith("text/event-stream")

            log_status("Events from the stream:")
            async for line in response.aiter_lines():
                print(line)
                log_status(line)

if __name__ == "__main__":
    asyncio.run(test_start_project())
