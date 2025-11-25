"""
Test script for forecasting engine with synthetic datasets

This script tests the forecasting engine with various scenarios:
1. High data scenario: >52 weeks with clear seasonality
2. Medium data scenario: 16-50 weeks with trend
3. Low data scenario: <16 weeks (sparse)

Run: python scripts/test_forecast.py
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from ml.forecast import generate_ml_forecast, ForecastConfig


def generate_synthetic_seasonal_data(weeks: int = 104, base_value: float = 5000) -> pd.DataFrame:
    """
    Generate synthetic data with clear seasonality (2 years of weekly data)
    
    Includes:
    - Upward trend
    - Yearly seasonality (peak in Dec)
    - Random noise
    - Some anomalies
    """
    start_date = datetime(2022, 1, 1)
    dates = [start_date + timedelta(weeks=i) for i in range(weeks)]
    
    # Base trend
    trend = np.linspace(base_value, base_value * 1.5, weeks)
    
    # Seasonality (yearly cycle)
    seasonality = 1000 * np.sin(2 * np.pi * np.arange(weeks) / 52)
    
    # Random noise
    noise = np.random.normal(0, 200, weeks)
    
    # Combine
    values = trend + seasonality + noise
    
    # Add some anomalies (spikes)
    anomaly_indices = np.random.choice(weeks, size=5, replace=False)
    values[anomaly_indices] *= 2
    
    # Add some returns (negative values)
    return_indices = np.random.choice(weeks, size=3, replace=False)
    values[return_indices] *= -0.1
    
    df = pd.DataFrame({
        'InvoiceDate': dates,
        'TotalAmount': values
    })
    
    return df


def generate_synthetic_medium_data(weeks: int = 30, base_value: float = 3000) -> pd.DataFrame:
    """
    Generate synthetic data with medium history (30 weeks)
    
    Includes:
    - Linear trend
    - Some noise
    """
    start_date = datetime(2023, 6, 1)
    dates = [start_date + timedelta(weeks=i) for i in range(weeks)]
    
    # Linear trend
    trend = np.linspace(base_value, base_value * 1.3, weeks)
    
    # Noise
    noise = np.random.normal(0, 150, weeks)
    
    values = trend + noise
    
    df = pd.DataFrame({
        'InvoiceDate': dates,
        'TotalAmount': values
    })
    
    return df


def generate_synthetic_sparse_data(weeks: int = 12, base_value: float = 2000) -> pd.DataFrame:
    """
    Generate sparse synthetic data (<16 weeks)
    """
    start_date = datetime(2024, 1, 1)
    dates = [start_date + timedelta(weeks=i) for i in range(weeks)]
    
    # Simple trend with noise
    trend = np.linspace(base_value, base_value * 1.2, weeks)
    noise = np.random.normal(0, 100, weeks)
    
    values = trend + noise
    
    df = pd.DataFrame({
        'InvoiceDate': dates,
        'TotalAmount': values
    })
    
    return df


def test_scenario(name: str, df: pd.DataFrame, horizons: list = [2, 4, 8]):
    """
    Test a forecast scenario with multiple horizons
    """
    print(f"\n{'='*80}")
    print(f"Testing: {name}")
    print(f"{'='*80}")
    print(f"Data points: {len(df)}")
    print(f"Date range: {df['InvoiceDate'].min()} to {df['InvoiceDate'].max()}")
    print(f"Value range: {df['TotalAmount'].min():.2f} to {df['TotalAmount'].max():.2f}")
    print(f"Mean value: {df['TotalAmount'].mean():.2f}")
    
    for horizon in horizons:
        print(f"\n--- Horizon: {horizon} weeks ---")
        
        try:
            result = generate_ml_forecast(df, horizon=horizon)
            
            # Check result structure
            assert 'historical' in result, "Missing 'historical' key"
            assert 'forecast' in result, "Missing 'forecast' key"
            assert 'totalForecast' in result, "Missing 'totalForecast' key"
            assert 'accuracy' in result, "Missing 'accuracy' key"
            
            accuracy = result['accuracy']
            
            print(f"✓ Forecast generated successfully")
            print(f"  Total Forecast: {result['totalForecast']:.2f}")
            print(f"  Forecast points: {len(result['forecast'])}")
            print(f"  Historical points: {len(result['historical'])}")
            
            if accuracy['mape'] is not None:
                print(f"  MAPE: {accuracy['mape']:.2f}%")
                print(f"  RMSE: {accuracy['rmse']:.2f}")
                print(f"  R²: {accuracy['r2']:.3f}")
                print(f"  Accuracy: {accuracy['accuracy']:.2f}%")
            else:
                print(f"  MAPE: N/A (insufficient data for backtesting)")
            
            print(f"  Confidence: {accuracy['confidence']}")
            
            # Validate confidence flags
            if len(df) < ForecastConfig.MIN_ARIMA_THRESHOLD:
                assert accuracy['confidence'] == 'LOW', f"Expected LOW confidence for sparse data, got {accuracy['confidence']}"
                print(f"  ✓ Correct confidence flag for sparse data")
            
            # Check forecast values are non-negative
            for f in result['forecast']:
                assert f['sales'] >= 0, "Negative sales in forecast"
                assert f['lower'] >= 0, "Negative lower bound"
                assert f['upper'] >= 0, "Negative upper bound"
            
            print(f"  ✓ All forecast values are non-negative")
            
            # Sample forecast output
            if len(result['forecast']) > 0:
                print(f"\n  Sample forecast:")
                for i, f in enumerate(result['forecast'][:3]):
                    print(f"    Week {i}: {f['week']} -> {f['sales']:.2f} [{f['lower']:.2f}, {f['upper']:.2f}]")
            
        except Exception as e:
            print(f"✗ FAILED: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    return True


def run_all_tests():
    """
    Run all test scenarios
    """
    print(f"\n{'#'*80}")
    print(f"# Forecast Engine Test Suite")
    print(f"{'#'*80}")
    
    print(f"\nConfiguration:")
    print(f"  Seasonal threshold: {ForecastConfig.SEASONAL_THRESHOLD} weeks")
    print(f"  Min ARIMA threshold: {ForecastConfig.MIN_ARIMA_THRESHOLD} weeks")
    print(f"  High confidence MAPE: <{ForecastConfig.HIGH_CONFIDENCE_MAPE}%")
    print(f"  Medium confidence MAPE: <{ForecastConfig.MEDIUM_CONFIDENCE_MAPE}%")
    
    results = []
    
    # Test 1: High data with seasonality
    print("\n\nTest 1: High Data Scenario (104 weeks, clear seasonality)")
    df1 = generate_synthetic_seasonal_data(weeks=104)
    results.append(("High Data", test_scenario("High Data with Seasonality", df1, horizons=[2, 4, 8])))
    
    # Test 2: Medium data with trend
    print("\n\nTest 2: Medium Data Scenario (30 weeks, linear trend)")
    df2 = generate_synthetic_medium_data(weeks=30)
    results.append(("Medium Data", test_scenario("Medium Data with Trend", df2, horizons=[2, 4, 8])))
    
    # Test 3: Sparse data
    print("\n\nTest 3: Sparse Data Scenario (12 weeks)")
    df3 = generate_synthetic_sparse_data(weeks=12)
    results.append(("Sparse Data", test_scenario("Sparse Data", df3, horizons=[2, 4])))
    
    # Summary
    print(f"\n{'='*80}")
    print(f"Test Summary")
    print(f"{'='*80}")
    
    for name, passed in results:
        status = "✓ PASSED" if passed else "✗ FAILED"
        print(f"{name}: {status}")
    
    all_passed = all(r[1] for r in results)
    
    if all_passed:
        print(f"\n✓ All tests passed!")
    else:
        print(f"\n✗ Some tests failed")
    
    return all_passed


if __name__ == "__main__":
    # Set random seed for reproducibility
    np.random.seed(42)
    
    success = run_all_tests()
    sys.exit(0 if success else 1)
