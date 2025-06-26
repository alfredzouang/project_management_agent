import sqlite3
import json
import os

db_path = os.path.join(os.path.dirname(__file__), "../../../db/purchase_consultant_db.db")
conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
c = conn.cursor()
c.execute("""
    SELECT Company, JobTitle, StartDate, EndDate, Description
    FROM workexresume
    WHERE ItemNo = 'RN20240326000003_1'
""")
rows = c.fetchall()
work_experiences = []
for row in rows:
    work_experiences.append({
        "Company": row["Company"],
        "JobTitle": row["JobTitle"],
        "StartDate": row["StartDate"],
        "EndDate": row["EndDate"],
        "Description": row["Description"]
    })
print(json.dumps(work_experiences, ensure_ascii=False, indent=2))
conn.close()
