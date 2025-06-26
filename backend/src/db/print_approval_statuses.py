from sqlalchemy import text
from db.models.base_model import engine

with engine.connect() as conn:
    result = conn.execute(
        text(
            "SELECT DISTINCT [Approval Status] FROM purchase_requirement WHERE [Approval Status] IS NOT NULL AND [Approval Status] != ''"
        )
    )
    statuses = [row[0] for row in result]

print("Unique Approval Status values:")
for s in statuses:
    print(f"- {s}")
