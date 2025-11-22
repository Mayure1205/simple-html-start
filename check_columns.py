import pandas as pd

try:
    df = pd.read_csv('online_retail_II.csv', encoding='ISO-8859-1', nrows=5)
    print("Columns found:", df.columns.tolist())
except Exception as e:
    print("Error reading CSV:", e)
