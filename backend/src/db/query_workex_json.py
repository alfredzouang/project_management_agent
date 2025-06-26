import json
from db.models.base_model import SessionLocal
from db.models.project_management_models import WorkexResume

def main():
    session = SessionLocal()
    item_no = "RN20240326000003_1"
    workex_rows = session.execute(
        "SELECT Company, JobTitle, StartDate, EndDate, Description FROM workexresume WHERE ItemNo = :itemno",
        {"itemno": item_no}
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
    print(json.dumps(work_experiences, ensure_ascii=False, indent=2))
    session.close()

if __name__ == "__main__":
    main()
