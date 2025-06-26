import sqlite3
import json
import os

db_path = os.path.join(os.path.dirname(__file__), "../../../db/purchase_consultant_db.db")
conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
c = conn.cursor()

# 查询基础简历信息
c.execute("""
    SELECT * FROM resume WHERE RequirementNo = ?
""", ("RN20240326000003_1",))
resume_row = c.fetchone()
if resume_row is None:
    print(json.dumps({"error": "No resume found for RequirementNo=RN20240326000003_1"}))
    exit(1)
resume_dict = dict(resume_row)

# 查询工作经历
c.execute("""
    SELECT Company, JobTitle, StartDate, EndDate, Description
    FROM workexresume
    WHERE ItemNo = ?
""", ("RN20240326000003_1",))
workex_rows = c.fetchall()
work_experiences = []
for row in workex_rows:
    work_experiences.append({
        "Company": row["Company"],
        "JobTitle": row["JobTitle"],
        "StartDate": row["StartDate"],
        "EndDate": row["EndDate"],
        "Description": row["Description"]
    })

resume_dict["work_experiences"] = work_experiences

print(json.dumps(resume_dict, ensure_ascii=False, indent=2))
conn.close()
