"""
Custom Exceptions Module
"""

class CSVValidationError(Exception):
    """Raised when CSV validation fails"""
    pass

class FieldDetectionError(Exception):
    """Raised when field detection fails"""
    pass

class ForecastError(Exception):
    """Raised when forecasting fails"""
    pass
