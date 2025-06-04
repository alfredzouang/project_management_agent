from model.project_types import Project, ProjectTask, ProjectPlan, Resource, ProjectType
from typing import List, Dict, Any, Optional

import json

print(json.dumps(ProjectTask.schema_json()))