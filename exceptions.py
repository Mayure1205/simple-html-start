"""
Custom exceptions for CSV upload and validation
"""

class CSVValidationError(Exception):
    """Base exception for CSV validation errors"""
    pass

class InvalidCSVFormatError(CSVValidationError):
    """Raised when CSV format is invalid"""
    def __init__(self, message="Invalid CSV format. Please ensure your file has required columns: InvoiceNo, CustomerID, InvoiceDate, Quantity, Price"):
        self.message = message
        super().__init__(self.message)

class FileTooLargeError(CSVValidationError):
    """Raised when uploaded file exceeds size limit"""
    def __init__(self, max_size_mb=10):
        self.message = f"File too large. Maximum allowed size is {max_size_mb}MB."
        super().__init__(self.message)

class InsufficientDataError(CSVValidationError):
    """Raised when CSV doesn't have enough data for forecasting"""
    def __init__(self, min_rows=100, min_days=30):
        self.message = f"Insufficient data for forecasting. Need at least {min_rows} transactions spanning {min_days}+ days."
        super().__init__(self.message)

class InvalidDateFormatError(CSVValidationError):
    """Raised when date format is invalid"""
    def __init__(self, message="Invalid date format. Dates should be in YYYY-MM-DD or YYYY-MM-DD HH:MM:SS format."):
        self.message = message
        super().__init__(self.message)

class MissingColumnsError(CSVValidationError):
    """Raised when required columns are missing"""
    def __init__(self, missing_cols):
        self.missing_cols = missing_cols
        self.message = f"Missing required columns: {', '.join(missing_cols)}"
        super().__init__(self.message)

class InvalidFileTypeError(CSVValidationError):
    """Raised when file type is not CSV"""
    def __init__(self, message="Invalid file type. Only CSV files are allowed."):
        self.message = message
        super().__init__(self.message)
