import os
import sqlite3

db_path = os.path.join(os.path.dirname(__file__), "../../../db/purchase_consultant_db.db")
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute("SELECT DISTINCT [Approval Status] FROM purchase_requirement WHERE [Approval Status] IS NOT NULL AND [Approval Status] != ''")
statuses = [row[0] for row in cursor.fetchall()]

print("Unique Approval Status values:")
for s in statuses:
    print(f"- {s}")

conn.close()
