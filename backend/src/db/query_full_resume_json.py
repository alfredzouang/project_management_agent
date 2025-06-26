import os
import json
from db.models.base_model import SessionLocal
from db.models.project_management_models import Resume, WorkexResume

def main():
    session = SessionLocal()
    requirement_no = "RN20240326000003_1"

    # Query resume
    resume_row = session.execute(
        f"SELECT * FROM resume WHERE RequirementNo = :reqno",
        {"reqno": requirement_no}
    ).mappings().first()
    if resume_row is None:
        print(json.dumps({"error": f"No resume found for RequirementNo={requirement_no}"}))
        exit(1)
    resume_dict = dict(resume_row)

    # Query work experiences
    workex_rows = session.execute(
        f"SELECT Company, JobTitle, StartDate, EndDate, Description FROM workexresume WHERE ItemNo = :itemno",
        {"itemno": requirement_no}
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

    resume_dict["work_experiences"] = work_experiences

    print(json.dumps(resume_dict, ensure_ascii=False, indent=2))
    session.close()

if __name__ == "__main__":
    main()
