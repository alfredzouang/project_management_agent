import json
import sys
from db.models.base_model import SessionLocal
from db.models.project_management_models import Consultant, Resume, WorkexResume

def query_consultant_full_info(resume_no):
    session = SessionLocal()

    # Consultant info
    consultant_row = session.execute(
        'SELECT * FROM consultant WHERE "Resume No." = :resume_no',
        {"resume_no": resume_no}
    ).mappings().first()
    if consultant_row is None:
        print(json.dumps({"error": f"No consultant found for Resume No.={resume_no}"}))
        session.close()
        return
    consultant_dict = dict(consultant_row)

    # Resume info
    resume_row = session.execute(
        "SELECT * FROM resume WHERE RequirementNo = :reqno",
        {"reqno": resume_no}
    ).mappings().first()
    if resume_row is None:
        print(json.dumps({"error": f"No resume found for RequirementNo={resume_no}"}))
        session.close()
        return
    resume_dict = dict(resume_row)

    # Work experiences
    workex_rows = session.execute(
        "SELECT Company, JobTitle, StartDate, EndDate, Description FROM workexresume WHERE ItemNo = :itemno",
        {"itemno": resume_no}
    ).mappings().all()
    work_experiences = []
    for row in workex_rows:
        work_experiences.append({
            "Company": row["Company"],
            "JobTitle": row["JobTitle"],
            "StartDate": row["StartDate"],
            "EndDate": row["EndDate"],
            "Description": row["Description"]
        })

    result = {
        "consultant": consultant_dict,
        "resume": resume_dict,
        "work_experiences": work_experiences
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))
    session.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 query_consultant_full_info.py <resume_no>")
        sys.exit(1)
    resume_no = sys.argv[1]
    query_consultant_full_info(resume_no)
