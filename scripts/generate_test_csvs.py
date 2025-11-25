"""
Generate synthetic CSV files for testing the forecasting engine

Run: python scripts/generate_test_csvs.py

This will create three CSV files in the scripts/ directory:
- test_seasonal_104weeks.csv (high data with seasonality)
- test_medium_30weeks.csv (medium data with trend)
- test_sparse_12weeks.csv (sparse data)
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os

OUTPUT_DIR = "scripts/test_data"
os.makedirs(OUTPUT_DIR, exist_ok=True)


def generate_seasonal_csv():
    """104 weeks with clear seasonality"""
    np.random.seed(42)
    start_date = datetime(2022, 1, 1)
    weeks = 104
    base_value = 5000
    
    dates = [start_date + timedelta(weeks=i) for i in range(weeks)]
    trend = np.linspace(base_value, base_value * 1.5, weeks)
    seasonality = 1000 * np.sin(2 * np.pi * np.arange(weeks) / 52)
    noise = np.random.normal(0, 200, weeks)
    values = trend + seasonality + noise
    
    # Add anomalies
    anomaly_indices = np.random.choice(weeks, size=5, replace=False)
    values[anomaly_indices] *= 2
    
    # Add returns
    return_indices = np.random.choice(weeks, size=3, replace=False)
    values[return_indices] *= -0.1
    
    df = pd.DataFrame({
        'Date': dates,
        'Revenue': values.round(2)
    })
    
    filepath = os.path.join(OUTPUT_DIR, "test_seasonal_104weeks.csv")
    df.to_csv(filepath, index=False)
    print(f"✓ Generated: {filepath}")
    print(f"  Rows: {len(df)}, Mean: ${df['Revenue'].mean():.2f}")


def generate_medium_csv():
    """30 weeks with linear trend"""
    np.random.seed(43)
    start_date = datetime(2023, 6, 1)
    weeks = 30
    base_value = 3000
    
    dates = [start_date + timedelta(weeks=i) for i in range(weeks)]
    trend = np.linspace(base_value, base_value * 1.3, weeks)
    noise = np.random.normal(0, 150, weeks)
    values = trend + noise
    
    df = pd.DataFrame({
        'Date': dates,
        'Revenue': values.round(2)
    })
    
    filepath = os.path.join(OUTPUT_DIR, "test_medium_30weeks.csv")
    df.to_csv(filepath, index=False)
    print(f"✓ Generated: {filepath}")
    print(f"  Rows: {len(df)}, Mean: ${df['Revenue'].mean():.2f}")


def generate_sparse_csv():
    """12 weeks - sparse data"""
    np.random.seed(44)
    start_date = datetime(2024, 1, 1)
    weeks = 12
    base_value = 2000
    
    dates = [start_date + timedelta(weeks=i) for i in range(weeks)]
    trend = np.linspace(base_value, base_value * 1.2, weeks)
    noise = np.random.normal(0, 100, weeks)
    values = trend + noise
    
    df = pd.DataFrame({
        'Date': dates,
        'Revenue': values.round(2)
    })
    
    filepath = os.path.join(OUTPUT_DIR, "test_sparse_12weeks.csv")
    df.to_csv(filepath, index=False)
    print(f"✓ Generated: {filepath}")
    print(f"  Rows: {len(df)}, Mean: ${df['Revenue'].mean():.2f}")


if __name__ == "__main__":
    print("Generating synthetic test CSV files...\n")
    generate_seasonal_csv()
    generate_medium_csv()
    generate_sparse_csv()
    print(f"\nAll files saved to: {OUTPUT_DIR}/")
    print("\nYou can now upload these CSVs via the UI to test forecasting.")
