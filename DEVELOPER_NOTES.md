# Developer Notes - Enhanced Forecasting Engine

## What Changed

### Backend Improvements (app.py + ml/forecast.py)

**1. New Forecasting Module** (`ml/forecast.py`)
- Replaced simple linear regression with intelligent model selection
- Auto-switches between Prophet (seasonal), ARIMA (trend), or Baseline (sparse) based on data availability
- Implements rolling-origin backtesting for robust accuracy metrics
- Includes anomaly detection and outlier handling
- All models return same API structure - **no frontend changes needed**

**2. API Contract** (Preserved)
The `/api/dashboard` endpoint returns **exactly the same JSON structure**:
```json
{
  "forecast": {
    "totalForecast": float,
    "historical": [{"date": str, "sales": float}],
    "forecast": [{"week": str, "sales": float, "lower": float, "upper": float}],
    "accuracy": {
      "mape": float | null,
      "rmse": float | null,
      "r2": float | null,
      "accuracy": float,
      "confidence": "HIGH" | "MEDIUM" | "LOW"
    }
  },
  ...all other fields unchanged...
}
```

**3. Model Selection Logic**

| Data Points | Model | Confidence |
|------------|-------|------------|
| ≥52 weeks | Prophet/SARIMAX | Based on backtest |
| 16-51 weeks | ARIMA | Based on backtest |
| <16 weeks | Linear Baseline | Always LOW |

**4. Key Features**
- **Anomaly Detection**: Automatically detects and caps spikes using z-score
- **Negative Value Handling**: Explicitly includes returns as negative (configurable)
- **Missing Week Filling**: Fills gaps with zeros to avoid discontinuities
- **Backtesting**: Uses rolling windows to compute real MAPE/RMSE/R² on holdout data
- **Error Handling**: Graceful fallbacks if model fitting fails

### Dependencies Added

```txt
prophet==1.1.5         # Seasonal forecasting (optional but recommended)
pmdarima==2.0.4        # AutoARIMA fallback
statsmodels==0.14.1    # Statistical models
```

## Testing

### 1. Automated Tests

Run the comprehensive test suite:

```bash
python scripts/test_forecast.py
```

**Expected Results**:
- ✓ High data (104 weeks): Uses Prophet/SARIMAX, confidence HIGH/MEDIUM
- ✓ Medium data (30 weeks): Uses ARIMA, confidence MEDIUM
- ✓ Sparse data (12 weeks): Uses Baseline, confidence LOW

### 2. Generate Test CSVs

Create synthetic datasets for manual testing:

```bash
python scripts/generate_test_csvs.py
```

Output: `scripts/test_data/*.csv`

### 3. Manual Testing via UI

1. Start backend: `python app.py`
2. Upload one of the test CSVs
3. Map columns: `Date` → date, `Revenue` → value
4. Select different date ranges and horizons
5. Verify:
   - Forecast displays properly
   - Accuracy metrics update
   - Confidence flag reflects data quality
   - No API errors in browser console

### 4. Integration Test with Real Data

Use the existing `online_retail_II.csv`:

1. Upload CSV
2. Map: `InvoiceDate` → date, `TotalAmount` → value
3. Select full date range (should have >52 weeks)
4. Try horizon = 8 weeks
5. Expected: MAPE < 30%, confidence MEDIUM or HIGH

## Configuration

Edit `ml/forecast.py` → `ForecastConfig` class:

```python
class ForecastConfig:
    # When to use seasonal models
    SEASONAL_THRESHOLD = 52  # weeks
    MIN_ARIMA_THRESHOLD = 16
    
    # Confidence thresholds
    HIGH_CONFIDENCE_MAPE = 15   # <15% MAPE → HIGH
    MEDIUM_CONFIDENCE_MAPE = 30  # <30% MAPE → MEDIUM
    
    # Anomaly detection sensitivity
    ZSCORE_THRESHOLD = 3.0
    
    # How to handle negative values (returns)
    RETURNS_HANDLING = "include_as_negative"  # or "absolute", "subtract"
```

## Debugging

### Check Server Logs

All forecast operations log to stdout:

```bash
python app.py
# Look for:
# [INFO] Starting forecast generation with horizon=4
# [INFO] Model used: Prophet (Seasonal)
# [INFO] Backtest complete - MAPE: 12.5%, Confidence: HIGH
```

### Common Issues

**1. Prophet Installation Fails**
- Windows users: Use `conda install -c conda-forge prophet`
- Or skip Prophet - engine will auto-fallback to pmdarima

**2. Low Confidence on Good Data**
- Check sparsity (many zero weeks?)
- Review date range selection
- Inspect anomalies in logs

**3. Forecast Looks Flat**
- For sparse data (<16 weeks), only linear baseline is used
- Try larger date range if available

**4. Negative Forecast Values**
- Should not happen - all forecasts capped at 0
- If it does, check `ml/forecast.py` line ~420 (ensure `np.maximum(predictions, 0)`)

## Performance Notes

- Model fitting is **synchronous** (blocks API call)
- Typical latency:
  - Baseline: <100ms
  - ARIMA: 200-500ms
  - Prophet: 500-2000ms (first run)
- For production with high traffic, consider:
  - Caching (already keyed by filename+mapping+daterange+horizon)
  - Moving to background worker (Celery/RQ)
  - Prophet model warm-up on startup

## Migration Path

**No frontend changes needed** - the API contract is unchanged.

Steps to deploy:
1. Update `requirements.txt`
2. Install dependencies: `pip install -r requirements.txt`
3. Run tests: `python scripts/test_forecast.py`
4. Deploy updated `app.py` and `ml/` directory
5. Monitor logs for model selection and accuracy

## Rollback Plan

If issues arise:

1. **Immediate**: Comment out `from ml.forecast import generate_ml_forecast` in app.py
2. Restore old function from git history
3. Or keep both and add feature flag:
   ```python
   USE_ENHANCED_FORECAST = os.getenv('USE_ENHANCED_FORECAST', 'true').lower() == 'true'
   
   if USE_ENHANCED_FORECAST:
       from ml.forecast import generate_ml_forecast
   else:
       # Use old implementation
   ```

## Future Enhancements

### Short Term
- [ ] Add Prophet model caching (pkl files)
- [ ] Expose anomalies in API response for debugging
- [ ] Add custom seasonality periods (quarterly, monthly)

### Medium Term
- [ ] Async model training with Celery
- [ ] A/B test forecasts vs actuals (post-deployment)
- [ ] Multi-step ahead confidence intervals

### Long Term
- [ ] Ensemble models (Prophet + ARIMA + XGBoost)
- [ ] Automatic holiday detection and adjustment
- [ ] Real-time forecast updates on new data

## Questions?

Check:
1. `ml/forecast.py` - detailed implementation comments
2. `scripts/test_forecast.py` - usage examples
3. Server logs - verbose logging enabled
4. `FORECAST_SETUP.md` - user-facing setup guide

## Verification Checklist

Before considering this complete:

- [x] New forecasting module created (`ml/forecast.py`)
- [x] `app.py` updated to use new module
- [x] `requirements.txt` updated with dependencies
- [x] Test suite created (`scripts/test_forecast.py`)
- [x] Test data generator created (`scripts/generate_test_csvs.py`)
- [x] API contract preserved (same JSON keys)
- [x] Setup documentation created (`FORECAST_SETUP.md`)
- [x] Developer notes created (this file)
- [ ] Manual UI testing completed
- [ ] Integration test with real data passed
- [ ] Dependencies installed and verified
- [ ] Test suite passes

Run the test suite to verify:
```bash
python scripts/test_forecast.py
```

Expected: All tests ✓ PASSED
