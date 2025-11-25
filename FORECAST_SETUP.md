# Enhanced Forecasting Engine - Setup & Testing Guide

## Overview

The enhanced forecasting engine provides production-ready forecasts with:
- **Auto-switching models**: Prophet/SARIMAX for seasonal data, baseline for sparse data
- **Rolling-origin backtesting**: Robust accuracy metrics with confidence flags
- **Anomaly detection**: Automatic spike/outlier handling
- **Clear confidence flags**: HIGH/MEDIUM/LOW based on backtesting performance

## Installation

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

**Note**: Prophet installation may require additional dependencies:
- On Linux/Mac: `pip install prophet` should work
- On Windows: You may need to install `pystan` first or use conda:
  ```bash
  conda install -c conda-forge prophet
  ```

If Prophet installation fails, the engine will automatically fall back to pmdarima (AutoARIMA).

### 2. Verify Installation

Test that all components are installed:

```bash
python -c "import prophet; print('Prophet OK')"
python -c "import pmdarima; print('pmdarima OK')"
python -c "import statsmodels; print('statsmodels OK')"
```

## Testing

### Run Test Suite

The test suite validates the forecasting engine with synthetic data:

```bash
python scripts/test_forecast.py
```

**Expected output:**
- Test 1: High data (104 weeks) → Should use Prophet/SARIMAX with HIGH/MEDIUM confidence
- Test 2: Medium data (30 weeks) → Should use ARIMA with MEDIUM confidence
- Test 3: Sparse data (12 weeks) → Should use baseline with LOW confidence

All tests should pass with `✓ PASSED` status.

### Manual Testing via UI

1. **Start backend**: `python app.py`
2. **Upload CSV** with date and value columns
3. **Select date range** covering different data densities
4. **Try different horizons**: 2, 4, 8, 12 weeks
5. **Observe**:
   - Forecast should show smooth trends + seasonality (if enough data)
   - Accuracy metrics should update based on backtest
   - Confidence flag should reflect data quality

### Test with Example Dataset

Use the provided `online_retail_II.csv` (if available):

```bash
# Start backend
python app.py

# In UI:
# 1. Upload online_retail_II.csv
# 2. Map columns: InvoiceDate → date, TotalAmount → value
# 3. Select full date range (should have >52 weeks)
# 4. Try horizon = 8 weeks
# Expected: HIGH or MEDIUM confidence with MAPE < 30%
```

## Model Selection Logic

The engine automatically chooses the best model based on data availability:

| Weekly Data Points | Model Used | Confidence Cap | Notes |
|-------------------|------------|----------------|-------|
| ≥ 52 weeks        | Prophet or SARIMAX | HIGH/MEDIUM/LOW | Full seasonal modeling |
| 16-51 weeks       | ARIMA (reduced seasonality) | MEDIUM/LOW | Trend + limited seasonality |
| < 16 weeks        | Linear Baseline | LOW | Simple explainable model |

## Accuracy Metrics

All forecasts include backtesting-based metrics:

- **MAPE** (Mean Absolute Percentage Error): Lower is better
- **RMSE** (Root Mean Squared Error): Absolute error magnitude
- **R²**: Goodness of fit (0-1, higher is better)
- **Accuracy**: `100 - MAPE` (capped at 0)
- **Confidence**: HIGH (<15% MAPE), MEDIUM (<30% MAPE), LOW (≥30% or insufficient data)

## Configuration

Edit `ml/forecast.py` → `ForecastConfig` to adjust:

```python
class ForecastConfig:
    # Model selection thresholds
    SEASONAL_THRESHOLD = 52  # Weeks needed for seasonal model
    MIN_ARIMA_THRESHOLD = 16  # Minimum for ARIMA
    
    # Accuracy thresholds
    HIGH_CONFIDENCE_MAPE = 15
    MEDIUM_CONFIDENCE_MAPE = 30
    
    # Anomaly detection
    ZSCORE_THRESHOLD = 3.0
    
    # Negative values handling
    RETURNS_HANDLING = "include_as_negative"  # or "absolute", "subtract"
```

## API Contract (Unchanged)

The `/api/dashboard` endpoint returns the same JSON structure:

```json
{
  "forecast": {
    "totalForecast": 50000,
    "historical": [{"date": "01 Jan", "sales": 5000}, ...],
    "forecast": [{"week": "08 Jan", "sales": 5200, "lower": 4800, "upper": 5600}, ...],
    "accuracy": {
      "mape": 12.5,
      "rmse": 450.2,
      "r2": 0.85,
      "accuracy": 87.5,
      "confidence": "HIGH"
    }
  },
  "countries": [...],
  "products": [...],
  "rfm": {...},
  ...
}
```

**All existing keys preserved** - frontend requires no changes.

## Troubleshooting

### Prophet Installation Issues

If Prophet won't install:
1. Try `conda install -c conda-forge prophet`
2. Or disable Prophet in `ml/forecast.py` and rely on pmdarima:
   ```python
   # Comment out Prophet import and fit_prophet_model function
   ```

### Low Confidence on Good Data

Check:
- **Date range**: Ensure enough historical weeks
- **Data quality**: High sparsity (many zero weeks) lowers confidence
- **Anomalies**: Check logs for detected anomalies

### Forecast Values Seem Off

Check:
- **Negative values**: Review `RETURNS_HANDLING` config
- **Anomalies**: Anomalies are capped but logged - check server output
- **Horizon too large**: For sparse data, reduce horizon

### Performance Issues

- Model training is synchronous (blocks during API call)
- For production, consider moving to background worker (Celery/RQ)
- Current design supports this - model selection is stateless

## Next Steps

1. **Review backtest metrics** in production with real data
2. **Tune thresholds** in `ForecastConfig` based on domain requirements
3. **Add custom seasonality** if your data has non-yearly patterns (e.g., quarterly)
4. **Export forecasts** for audit trails (hash already computed)

## Support

For issues or questions:
- Check server logs (`python app.py` output) for detailed error messages
- All forecast operations are logged with `logger.info()` and `logger.warning()`
- Review `ml/forecast.py` comments for implementation details
