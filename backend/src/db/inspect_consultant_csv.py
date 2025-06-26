import pandas as pd
import os

csv_path = os.path.join(os.path.dirname(__file__), '../../../data/consultant/Active Rating Values for Skill 6-10-2025 9-31-25 AM.csv')
try:
    df = pd.read_csv(csv_path, encoding='utf-8')
    print("表头:", list(df.columns))
    print("前3行数据:")
    print(df.head(3).to_string(index=False))
except Exception as e:
    print(f"读取失败: {e}")
