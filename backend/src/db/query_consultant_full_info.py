import sqlite3
import json
import os
import sys

def query_consultant_full_info(resume_no):
    db_path = os.path.join(os.path.dirname(__file__), "../../../db/purchase_consultant_db.db")
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    # 查询 consultant 基本信息
    c.execute("""
        SELECT * FROM consultant WHERE "Resume No." = ?
    """, (resume_no,))
    consultant_row = c.fetchone()
    if consultant_row is None:
        print(json.dumps({"error": f"No consultant found for Resume No.={resume_no}"}))
        conn.close()
        return
    consultant_dict = dict(consultant_row)

    # 查询 resume 信息
    c.execute("""
        SELECT * FROM resume WHERE RequirementNo = ?
    """, (resume_no,))
    resume_row = c.fetchone()
    if resume_row is None:
        print(json.dumps({"error": f"No resume found for RequirementNo={resume_no}"}))
        conn.close()
        return
    resume_dict = dict(resume_row)

    # 查询所有工作经历
    c.execute("""
        SELECT Company, JobTitle, StartDate, EndDate, Description
        FROM workexresume
        WHERE ItemNo = ?
    """, (resume_no,))
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

    # 合并输出
    result = {
        "consultant": consultant_dict,
        "resume": resume_dict,
        "work_experiences": work_experiences
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))
    conn.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 query_consultant_full_info.py <resume_no>")
        sys.exit(1)
    resume_no = sys.argv[1]
    query_consultant_full_info(resume_no)
