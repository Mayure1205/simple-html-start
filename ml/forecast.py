"""
Enhanced Forecasting Module with Seasonality, Backtesting, and Anomaly Detection

This module provides production-ready forecasting with:
- Auto-switching models based on data availability (Prophet/SARIMAX/Baseline)
- Rolling-origin backtesting for robust accuracy metrics
- Anomaly detection and outlier handling
- Clear confidence flags and error handling
- Comprehensive error logging and safe fallbacks
"""

import pandas as pd
import numpy as np
from datetime import timedelta
from typing import Dict, List, Tuple, Optional
import logging
import warnings

# Suppress timezone and other warnings
warnings.filterwarnings('ignore', category=FutureWarning)
warnings.filterwarnings('ignore', category=UserWarning)
warnings.filterwarnings('ignore', message='.*timezone.*')

# Configure logging with more detail
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class ForecastConfig:
    """Configuration for forecasting behavior"""
    
    # Model selection thresholds (weekly data points)
    SEASONAL_THRESHOLD = 52  # 1 year of weekly data
    MIN_ARIMA_THRESHOLD = 16  # Minimum for ARIMA/seasonal models
    
    # Accuracy thresholds for confidence flags
    HIGH_CONFIDENCE_MAPE = 15
    MEDIUM_CONFIDENCE_MAPE = 30
    
    # Anomaly detection
    ZSCORE_THRESHOLD = 3.0  # Z-score for outlier detection
    
    # Backtesting
    MIN_BACKTEST_WINDOWS = 2  # Minimum rolling windows for backtesting
    BACKTEST_STEP = 1  # Step size for rolling windows (weeks)
    
    # Negative values handling
    RETURNS_HANDLING = "include_as_negative"  # Options: "include_as_negative", "absolute", "subtract"


def detect_and_handle_anomalies(series: pd.Series, method: str = "zscore") -> Tuple[pd.Series, List[int]]:
    """
    Detect anomalies in time series and return cleaned series with anomaly indices
    
    Args:
        series: Time series data
        method: Detection method ("zscore" or "iqr")
    
    Returns:
        Tuple of (cleaned_series, anomaly_indices)
    """
    if len(series) < 4:
        return series.copy(), []
    
    anomaly_indices = []
    cleaned = series.copy()
    
    if method == "zscore":
        z_scores = np.abs((series - series.mean()) / series.std())
        anomaly_mask = z_scores > ForecastConfig.ZSCORE_THRESHOLD
        anomaly_indices = series.index[anomaly_mask].tolist()
        
        # Cap anomalies at mean + 2*std
        cap_value = series.mean() + 2 * series.std()
        cleaned[anomaly_mask] = np.minimum(series[anomaly_mask], cap_value)
        
    elif method == "iqr":
        Q1 = series.quantile(0.25)
        Q3 = series.quantile(0.75)
        IQR = Q3 - Q1
        lower_bound = Q1 - 1.5 * IQR
        upper_bound = Q3 + 1.5 * IQR
        
        anomaly_mask = (series < lower_bound) | (series > upper_bound)
        anomaly_indices = series.index[anomaly_mask].tolist()
        
        # Cap anomalies
        cleaned = series.clip(lower=lower_bound, upper=upper_bound)
    
    if anomaly_indices:
        logger.info(f"Detected {len(anomaly_indices)} anomalies using {method} method")
    
    return cleaned, anomaly_indices


def prepare_weekly_series(df: pd.DataFrame, date_col: str = 'InvoiceDate', 
                         value_col: str = 'TotalAmount') -> pd.DataFrame:
    """
    Prepare weekly aggregated series with proper handling of missing weeks and negative values
    
    Args:
        df: Raw transaction data
        date_col: Name of date column
        value_col: Name of value column
    
    Returns:
        DataFrame with weekly aggregated data
    """
    # Aggregate to weekly series
    weekly = df.set_index(date_col)[value_col].resample('W').sum().reset_index()
    weekly.columns = ['date', 'value']
    
    # Handle negative values based on config
    if ForecastConfig.RETURNS_HANDLING == "absolute":
        weekly['value'] = weekly['value'].abs()
        logger.info("Converted negative values to absolute")
    elif ForecastConfig.RETURNS_HANDLING == "subtract":
        # Separate positive and negative for future analysis if needed
        pass
    # Default: include_as_negative - no change needed
    
    # Fill missing weeks with zeros (but mark sparsity)
    if len(weekly) > 0:
        date_range = pd.date_range(start=weekly['date'].min(), end=weekly['date'].max(), freq='W')
        weekly = weekly.set_index('date').reindex(date_range, fill_value=0).reset_index()
        weekly.columns = ['date', 'value']
        
        sparsity = (weekly['value'] == 0).sum() / len(weekly) * 100
        if sparsity > 30:
            logger.warning(f"High sparsity detected: {sparsity:.1f}% of weeks have zero values")
    
    return weekly


def calculate_accuracy_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> Dict:
    """
    Calculate comprehensive accuracy metrics
    
    Args:
        y_true: Actual values
        y_pred: Predicted values
    
    Returns:
        Dictionary with mape, rmse, r2, accuracy, confidence
    """
    # Avoid division by zero
    y_true_safe = np.where(y_true == 0, 1e-10, y_true)
    
    # MAPE (Mean Absolute Percentage Error)
    mape = np.mean(np.abs((y_true - y_pred) / y_true_safe)) * 100
    
    # RMSE (Root Mean Squared Error)
    rmse = np.sqrt(np.mean((y_true - y_pred) ** 2))
    
    # R² Score
    ss_res = np.sum((y_true - y_pred) ** 2)
    ss_tot = np.sum((y_true - y_true.mean()) ** 2)
    r2 = 1 - (ss_res / ss_tot) if ss_tot > 0 else 0
    
    # Accuracy (100 - MAPE, capped at 0)
    accuracy = max(0, 100 - mape)
    
    # Confidence flag
    if mape < ForecastConfig.HIGH_CONFIDENCE_MAPE:
        confidence = 'HIGH'
    elif mape < ForecastConfig.MEDIUM_CONFIDENCE_MAPE:
        confidence = 'MEDIUM'
    else:
        confidence = 'LOW'
    
    return {
        'mape': round(float(mape), 2),
        'rmse': round(float(rmse), 2),
        'r2': round(float(r2), 3),
        'accuracy': round(float(accuracy), 2),
        'confidence': confidence
    }


def rolling_origin_backtest(series: pd.Series, horizon: int, min_train_size: int) -> Optional[Dict]:
    """
    Perform rolling-origin backtesting to compute robust accuracy metrics
    
    Args:
        series: Time series data (weekly)
        horizon: Forecast horizon (weeks)
        min_train_size: Minimum training size
    
    Returns:
        Dictionary with aggregated backtest metrics or None if insufficient data
    """
    if len(series) < min_train_size + horizon:
        logger.warning(f"Insufficient data for backtesting: need {min_train_size + horizon}, have {len(series)}")
        return None
    
    # Determine number of backtest windows
    max_windows = (len(series) - min_train_size) // ForecastConfig.BACKTEST_STEP
    num_windows = min(max_windows, 8)  # Cap at 8 windows for performance
    
    if num_windows < ForecastConfig.MIN_BACKTEST_WINDOWS:
        logger.warning(f"Not enough windows for backtesting: {num_windows} < {ForecastConfig.MIN_BACKTEST_WINDOWS}")
        return None
    
    all_actuals = []
    all_predictions = []
    
    logger.info(f"Running rolling-origin backtest with {num_windows} windows, horizon={horizon}")
    
    for i in range(num_windows):
        # Split at origin
        split_idx = min_train_size + i * ForecastConfig.BACKTEST_STEP
        train = series.iloc[:split_idx]
        test = series.iloc[split_idx:split_idx + horizon]
        
        if len(test) < horizon:
            break
        
        # Simple baseline for backtesting: linear trend on week index
        X_train = np.arange(len(train)).reshape(-1, 1)
        y_train = train.values
        
        from sklearn.linear_model import LinearRegression
        model = LinearRegression()
        model.fit(X_train, y_train)
        
        # Predict test period
        X_test = np.arange(len(train), len(train) + len(test)).reshape(-1, 1)
        predictions = model.predict(X_test)
        
        all_actuals.extend(test.values)
        all_predictions.extend(predictions)
    
    if len(all_actuals) == 0:
        return None
    
    # Calculate metrics on all backtest predictions
    metrics = calculate_accuracy_metrics(
        np.array(all_actuals), 
        np.array(all_predictions)
    )
    
    logger.info(f"Backtest complete - MAPE: {metrics['mape']:.2f}%, Confidence: {metrics['confidence']}")
    
    return metrics


def fit_prophet_model(weekly_df: pd.DataFrame, horizon: int) -> Tuple[List[float], List[float], List[float]]:
    """
    Fit Prophet model for seasonal forecasting
    
    Args:
        weekly_df: Weekly data with 'date' and 'value' columns
        horizon: Forecast horizon in weeks
    
    Returns:
        Tuple of (predictions, lower_bounds, upper_bounds)
    
    Raises:
        ImportError: If Prophet is not installed
        Exception: If model fitting fails
    """
    try:
        from prophet import Prophet
        
        logger.info("Attempting to fit Prophet model...")
        
        # Prepare data for Prophet (requires 'ds' and 'y' columns)
        prophet_df = weekly_df[['date', 'value']].copy()
        prophet_df.columns = ['ds', 'y']
        
        # Ensure timezone-naive dates (fixes timezone warnings)
        if hasattr(prophet_df['ds'].dtype, 'tz') and prophet_df['ds'].dtype.tz is not None:
            prophet_df['ds'] = prophet_df['ds'].dt.tz_localize(None)
        
        # Configure Prophet with error handling
        model = Prophet(
            yearly_seasonality=True,
            weekly_seasonality=False,  # Already weekly data
            daily_seasonality=False,
            seasonality_mode='multiplicative',
            interval_width=0.85,
            uncertainty_samples=100  # Reduce for speed
        )
        
        # Suppress Prophet logging
        import logging as prophet_logging
        prophet_logging.getLogger('prophet').setLevel(prophet_logging.ERROR)
        prophet_logging.getLogger('cmdstanpy').setLevel(prophet_logging.ERROR)
        
        # Fit with timeout/error handling
        model.fit(prophet_df)
        
        # Create future dataframe
        future = model.make_future_dataframe(periods=horizon, freq='W')
        forecast = model.predict(future)
        
        # Extract forecast values (last 'horizon' rows)
        predictions = forecast['yhat'].tail(horizon).values
        lower = forecast['yhat_lower'].tail(horizon).values
        upper = forecast['yhat_upper'].tail(horizon).values
        
        # Ensure non-negative predictions
        predictions = np.maximum(predictions, 0)
        lower = np.maximum(lower, 0)
        upper = np.maximum(upper, 0)
        
        logger.info(f"✓ Prophet model fitted successfully - {horizon} week forecast generated")
        return predictions.tolist(), lower.tolist(), upper.tolist()
        
    except ImportError as e:
        logger.warning(f"Prophet not available: {e}")
        raise
    except Exception as e:
        logger.error(f"✗ Prophet fitting failed: {type(e).__name__}: {e}")
        raise


def fit_arima_model(weekly_df: pd.DataFrame, horizon: int, seasonal: bool = False) -> Tuple[List[float], List[float], List[float]]:
    """
    Fit ARIMA/SARIMAX model
    
    Args:
        weekly_df: Weekly data with 'date' and 'value' columns
        horizon: Forecast horizon in weeks
        seasonal: Whether to use seasonal ARIMA
    
    Returns:
        Tuple of (predictions, lower_bounds, upper_bounds)
    """
    try:
        from pmdarima import auto_arima
        
        # Fit auto ARIMA
        model = auto_arima(
            weekly_df['value'].values,
            seasonal=seasonal,
            m=52 if seasonal else 1,  # 52 weeks in a year
            suppress_warnings=True,
            stepwise=True,
            max_p=3, max_q=3,
            max_P=2, max_Q=2,
            error_action='ignore'
        )
        
        # Forecast
        forecast_result = model.predict(n_periods=horizon, return_conf_int=True, alpha=0.15)
        
        if isinstance(forecast_result, tuple):
            predictions, conf_int = forecast_result
            lower = conf_int[:, 0]
            upper = conf_int[:, 1]
        else:
            predictions = forecast_result
            # Manual confidence interval
            std_dev = np.std(weekly_df['value'].values)
            lower = predictions - 1.5 * std_dev
            upper = predictions + 1.5 * std_dev
        
        # Ensure non-negative
        predictions = np.maximum(predictions, 0)
        lower = np.maximum(lower, 0)
        upper = np.maximum(upper, 0)
        
        logger.info(f"{'Seasonal ' if seasonal else ''}ARIMA model fitted successfully")
        return predictions.tolist(), lower.tolist(), upper.tolist()
        
    except ImportError:
        logger.warning("pmdarima not available")
        raise
    except Exception as e:
        logger.error(f"ARIMA fitting failed: {e}")
        raise


def fit_baseline_model(weekly_df: pd.DataFrame, horizon: int) -> Tuple[List[float], List[float], List[float]]:
    """
    Fit simple baseline model (linear regression on week index)
    
    Args:
        weekly_df: Weekly data with 'date' and 'value' columns
        horizon: Forecast horizon in weeks
    
    Returns:
        Tuple of (predictions, lower_bounds, upper_bounds)
    """
    from sklearn.linear_model import LinearRegression
    
    # Prepare data
    X = np.arange(len(weekly_df)).reshape(-1, 1)
    y = weekly_df['value'].values
    
    # Fit model
    model = LinearRegression()
    model.fit(X, y)
    
    # Predict
    future_X = np.arange(len(weekly_df), len(weekly_df) + horizon).reshape(-1, 1)
    predictions = model.predict(future_X)
    
    # Simple confidence bands based on historical std
    std_dev = np.std(y)
    lower = predictions - 1.5 * std_dev
    upper = predictions + 1.5 * std_dev
    
    # Ensure non-negative
    predictions = np.maximum(predictions, 0)
    lower = np.maximum(lower, 0)
    upper = np.maximum(upper, 0)
    
    logger.info("Baseline linear regression model fitted")
    return predictions.tolist(), lower.tolist(), upper.tolist()


def generate_ml_forecast(df: pd.DataFrame, horizon: int = 4) -> Dict:
    """
    Main forecasting function with auto-model selection and robust accuracy measurement
    
    This function:
    1. Prepares weekly series with anomaly handling
    2. Selects appropriate model based on data availability
    3. Performs rolling-origin backtesting
    4. Returns forecast with accuracy metrics in API-compatible format
    
    SAFE FALLBACKS:
    - If advanced models fail → use linear baseline
    - If backtesting fails → return metrics as null with LOW confidence
    - If any error occurs → return minimal valid response
    
    Args:
        df: DataFrame with 'InvoiceDate' and 'TotalAmount' columns
        horizon: Forecast horizon in weeks (default: 4)
    
    Returns:
        Dictionary matching the API contract with:
        - historical: List of {date, sales} for last 8 weeks
        - forecast: List of {week, sales, lower, upper}
        - totalForecast: Sum of forecast values
        - accuracy: {mape, rmse, r2, accuracy, confidence}
    """
    logger.info(f"=" * 80)
    logger.info(f"🚀 Starting forecast generation with horizon={horizon} weeks")
    logger.info(f"=" * 80)
    
    try:
        # 1. Prepare weekly series
        logger.info("📊 Preparing weekly time series data...")
        weekly_df = prepare_weekly_series(df, 'InvoiceDate', 'TotalAmount')
        
        if len(weekly_df) < 4:
            logger.error(f"✗ Insufficient data: {len(weekly_df)} weeks (need at least 4)")
            raise ValueError("Insufficient data for forecasting (need at least 4 weeks)")
        
        logger.info(f"✓ Weekly series prepared: {len(weekly_df)} weeks")
        logger.info(f"  Date range: {weekly_df['date'].min()} to {weekly_df['date'].max()}")
        logger.info(f"  Value range: {weekly_df['value'].min():.2f} to {weekly_df['value'].max():.2f}")
        logger.info(f"  Mean value: {weekly_df['value'].mean():.2f}")
        
        # 2. Detect and handle anomalies
        logger.info("🔍 Detecting anomalies...")
        cleaned_series, anomaly_indices = detect_and_handle_anomalies(weekly_df['value'])
        weekly_df['value_cleaned'] = cleaned_series
        
        if anomaly_indices:
            logger.warning(f"⚠️  Detected {len(anomaly_indices)} anomalies at indices: {anomaly_indices[:5]}{'...' if len(anomaly_indices) > 5 else ''}")
        else:
            logger.info("✓ No anomalies detected")
        
        # Use cleaned data for modeling
        weekly_modeling = weekly_df[['date', 'value_cleaned']].copy()
        weekly_modeling.columns = ['date', 'value']
        
        # Filter out zero weeks for modeling (but keep for context)
        weekly_nonzero = weekly_modeling[weekly_modeling['value'] > 0].copy()
        weekly_points = len(weekly_nonzero)
        
        logger.info(f"📈 Data points for modeling: {weekly_points} non-zero weeks")
        
        # 3. Model selection based on data availability
        logger.info("🤖 Selecting optimal forecasting model...")
        model_used = None
        predictions = None
        lower_bounds = None
        upper_bounds = None
        confidence_override = None
        model_selection_log = []
        
        if weekly_points >= ForecastConfig.SEASONAL_THRESHOLD:
            # Sufficient data for seasonal model
            logger.info(f"→ Data >= {ForecastConfig.SEASONAL_THRESHOLD} weeks: trying seasonal models")
            model_selection_log.append("Attempted: Seasonal models (Prophet/SARIMAX)")
            
            try:
                predictions, lower_bounds, upper_bounds = fit_prophet_model(weekly_nonzero, horizon)
                model_used = "Prophet (Seasonal)"
            except Exception as e1:
                logger.warning(f"Prophet failed: {e1}, trying SARIMAX...")
                model_selection_log.append(f"Prophet failed: {type(e1).__name__}")
                try:
                    predictions, lower_bounds, upper_bounds = fit_arima_model(weekly_nonzero, horizon, seasonal=True)
                    model_used = "SARIMAX (Seasonal)"
                except Exception as e2:
                    logger.warning(f"SARIMAX failed: {e2}, falling back to ARIMA...")
                    model_selection_log.append(f"SARIMAX failed: {type(e2).__name__}")
                    try:
                        predictions, lower_bounds, upper_bounds = fit_arima_model(weekly_nonzero, horizon, seasonal=False)
                        model_used = "ARIMA (Non-seasonal)"
                    except Exception as e3:
                        logger.error(f"All ARIMA models failed: {e3}, using baseline")
                        model_selection_log.append(f"ARIMA failed: {type(e3).__name__}")
                        predictions, lower_bounds, upper_bounds = fit_baseline_model(weekly_nonzero, horizon)
                        model_used = "Linear Baseline (Fallback)"
                        confidence_override = 'LOW'
                    
        elif weekly_points >= ForecastConfig.MIN_ARIMA_THRESHOLD:
            # Medium data: use ARIMA without full seasonality
            logger.info(f"→ Data >= {ForecastConfig.MIN_ARIMA_THRESHOLD} weeks: trying ARIMA")
            model_selection_log.append("Attempted: ARIMA")
            
            try:
                predictions, lower_bounds, upper_bounds = fit_arima_model(weekly_nonzero, horizon, seasonal=False)
                model_used = "ARIMA"
            except Exception as e:
                logger.warning(f"ARIMA failed: {e}, using baseline")
                model_selection_log.append(f"ARIMA failed: {type(e).__name__}")
                predictions, lower_bounds, upper_bounds = fit_baseline_model(weekly_nonzero, horizon)
                model_used = "Linear Baseline (Fallback)"
                confidence_override = 'LOW'
                
        else:
            # Sparse data: use explainable baseline
            logger.info(f"→ Data < {ForecastConfig.MIN_ARIMA_THRESHOLD} weeks: using baseline")
            model_selection_log.append("Used: Linear Baseline (sparse data)")
            predictions, lower_bounds, upper_bounds = fit_baseline_model(weekly_nonzero, horizon)
            model_used = "Linear Baseline"
            confidence_override = 'LOW'
        
        logger.info(f"✓ Model selected: {model_used}")
        for log_entry in model_selection_log:
            logger.info(f"  - {log_entry}")
        
        # 4. Backtesting for accuracy metrics
        logger.info("🎯 Running rolling-origin backtesting...")
        min_train_size = max(8, weekly_points // 2)  # At least 8 weeks or half the data
        
        try:
            backtest_metrics = rolling_origin_backtest(weekly_nonzero['value'], horizon, min_train_size)
            
            if backtest_metrics is None:
                # Insufficient data for backtesting
                logger.warning("⚠️  Backtesting not possible - insufficient data")
                accuracy_metrics = {
                    'mape': None,
                    'rmse': None,
                    'r2': None,
                    'accuracy': 0,
                    'confidence': confidence_override or 'LOW'
                }
            else:
                accuracy_metrics = backtest_metrics
                if confidence_override:
                    accuracy_metrics['confidence'] = confidence_override
                logger.info(f"✓ Backtesting complete:")
                logger.info(f"  - MAPE: {accuracy_metrics['mape']:.2f}%")
                logger.info(f"  - RMSE: {accuracy_metrics['rmse']:.2f}")
                logger.info(f"  - R²: {accuracy_metrics['r2']:.3f}")
                logger.info(f"  - Confidence: {accuracy_metrics['confidence']}")
        
        except Exception as e:
            logger.error(f"✗ Backtesting failed: {e}")
            accuracy_metrics = {
                'mape': None,
                'rmse': None,
                'r2': None,
                'accuracy': 0,
                'confidence': confidence_override or 'LOW'
            }
        
        # 5. Format output for API compatibility
        last_date = weekly_df['date'].max()
        last_actual_value = weekly_df[weekly_df['value'] > 0]['value'].iloc[-1] if len(weekly_df[weekly_df['value'] > 0]) > 0 else 0
        
        # Format forecast array
        forecast = []
        
        # Add last historical point to connect lines
        forecast.append({
            'week': last_date.strftime('%d %b'),
            'sales': round(float(last_actual_value), 2),
            'lower': round(float(last_actual_value), 2),
            'upper': round(float(last_actual_value), 2)
        })
        
        # Add predictions
        for i in range(len(predictions)):
            date = last_date + timedelta(weeks=i+1)
            
            # Optional: Christmas boost (if needed, keep existing logic)
            pred = predictions[i]
            if date.month == 12 and 18 <= date.day <= 31:
                pred *= 1.15  # Reduced from 1.4 to be more conservative
                lower_bounds[i] *= 1.15
                upper_bounds[i] *= 1.15
            
            forecast.append({
                'week': date.strftime('%d %b'),
                'sales': round(float(pred), 2),
                'lower': round(float(lower_bounds[i]), 2),
                'upper': round(float(upper_bounds[i]), 2)
            })
        
        # Format historical data (last 8 weeks)
        historical = []
        historical_data = weekly_df[weekly_df['value'] > 0].tail(8)
        for _, row in historical_data.iterrows():
            historical.append({
                'date': row['date'].strftime('%d %b'),
                'sales': round(float(row['value']), 2)
            })
        
        # Calculate total forecast
        total_forecast = sum([f['sales'] for f in forecast])
        
        result = {
            'historical': historical,
            'forecast': forecast,
            'totalForecast': round(float(total_forecast), 2),
            'accuracy': accuracy_metrics
        }
        
        logger.info("=" * 80)
        logger.info(f"✅ Forecast generation complete!")
        logger.info(f"  Model: {model_used}")
        logger.info(f"  Total Forecast: {total_forecast:.2f}")
        logger.info(f"  Confidence: {accuracy_metrics['confidence']}")
        logger.info(f"  Historical points: {len(historical)}")
        logger.info(f"  Forecast points: {len(forecast)}")
        logger.info("=" * 80)
        
        return result
        
    except Exception as e:
        logger.error("=" * 80)
        logger.error(f"❌ FORECAST GENERATION FAILED")
        logger.error(f"Error type: {type(e).__name__}")
        logger.error(f"Error message: {e}")
        logger.error("=" * 80)
        
        import traceback
        traceback.print_exc()
        
        # Return safe fallback with LOW confidence
        logger.warning("⚠️  Returning safe fallback response with LOW confidence")
        return {
            'historical': [],
            'forecast': [],
            'totalForecast': 0,
            'accuracy': {
                'mape': None,
                'rmse': None,
                'r2': None,
                'accuracy': 0,
                'confidence': 'LOW'
            }
        }
