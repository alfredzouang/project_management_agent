import os
import xlrd
import pandas as pd

EXCEL_DIR = os.path.join(os.path.dirname(__file__), '../../../data/consultant')
EXCEL_FILES = [
    "Active Rating Values for Skill 6-10-2025 9-31-25 AM.xls",
    "Consultant-2025-06-03.xls",
    "Resume-2025-06-03.xls",
    "WorkExResume-20250606.xls"
]

def inspect_excel(file_path):
    print(f"==== {os.path.basename(file_path)} ====")
    try:
        book = xlrd.open_workbook(file_path)
        sheet = book.sheet_by_index(0)
        headers = sheet.row_values(0)
        print("表头:", headers)
        nrows = min(3, sheet.nrows - 1)
        print("前3行数据:")
        for i in range(1, nrows + 1):
            row = sheet.row_values(i)
            print(row)
    except Exception as e:
        print(f"读取失败: {e}")

def main():
    for fname in EXCEL_FILES:
        fpath = os.path.join(EXCEL_DIR, fname)
        if os.path.exists(fpath):
            inspect_excel(fpath)
        else:
            print(f"文件不存在: {fpath}")

if __name__ == "__main__":
    main()
