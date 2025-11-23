"""
CSV Validation utilities
"""
import pandas as pd
import os
from exceptions import (
    InvalidCSVFormatError,
    FileTooLargeError,
    InsufficientDataError,
    InvalidDateFormatError,
    MissingColumnsError,
    InvalidFileTypeError
)

# Configuration
MAX_FILE_SIZE_MB = 10
MIN_TRANSACTIONS = 100
MIN_DATE_RANGE_DAYS = 30
REQUIRED_COLUMNS = ['InvoiceNo', 'CustomerID', 'InvoiceDate', 'Quantity', 'Price']
ALLOWED_EXTENSIONS = ['.csv']

def validate_file_size(file):
    """
    Validate uploaded file size
    
    Args:
        file: FileStorage object from Flask request
        
    Raises:
        FileTooLargeError: If file exceeds MAX_FILE_SIZE_MB
    """
    # Get file size
    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)  # Reset file pointer
    
    max_size_bytes = MAX_FILE_SIZE_MB * 1024 * 1024
    
    if file_size > max_size_bytes:
        raise FileTooLargeError(max_size_mb=MAX_FILE_SIZE_MB)

def validate_file_type(filename):
    """
    Validate file extension
    
    Args:
        filename: Name of uploaded file
        
    Raises:
        InvalidFileTypeError: If file is not CSV
    """
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise InvalidFileTypeError()

def validate_csv_structure(df):
    """
    Validate CSV has required columns (flexible matching)
    
    Args:
        df: pandas DataFrame
        
    Raises:
        MissingColumnsError: If required columns are missing
    """
    # Flexible column mapping
    column_mapping = {
        'InvoiceNo': ['invoice', 'invoiceno', 'invoice_no', 'invoice no'],
        'CustomerID': ['customer', 'customerid', 'customer_id', 'customer id', 'cust'],
        'InvoiceDate': ['date', 'invoicedate', 'invoice_date', 'invoice date'],
        'Quantity': ['quantity', 'qty', 'amount'],
        'Price': ['price', 'unit price', 'unitprice', 'unit_price']
    }
    
    df_cols_lower = [col.lower().strip() for col in df.columns]
    
    missing = []
    for req_col, variations in column_mapping.items():
        # Check if any variation exists in columns
        found = False
        for variation in variations:
            if any(variation in col for col in df_cols_lower):
                found = True
                break
        
        if not found:
            missing.append(req_col)
    
    if missing:
        raise MissingColumnsError(missing)

def validate_data_sufficiency(df):
    """
    Validate CSV has enough data for forecasting
    
    Args:
        df: pandas DataFrame with 'InvoiceDate' column
        
    Raises:
        InsufficientDataError: If not enough data
        InvalidDateFormatError: If dates are invalid
    """
    # Check row count
    if len(df) < MIN_TRANSACTIONS:
        raise InsufficientDataError(min_rows=MIN_TRANSACTIONS, min_days=MIN_DATE_RANGE_DAYS)
    
    # Check date range
    try:
        df['InvoiceDate'] = pd.to_datetime(df['InvoiceDate'], errors='coerce')
        df = df.dropna(subset=['InvoiceDate'])
        
        if len(df) == 0:
            raise InvalidDateFormatError()
        
        date_range = (df['InvoiceDate'].max() - df['InvoiceDate'].min()).days
        
        if date_range < MIN_DATE_RANGE_DAYS:
            raise InsufficientDataError(min_rows=MIN_TRANSACTIONS, min_days=MIN_DATE_RANGE_DAYS)
            
    except (ValueError, TypeError) as e:
        raise InvalidDateFormatError()

def validate_uploaded_csv(file, filepath):
    """
    Complete validation pipeline for uploaded CSV
    
    Args:
        file: FileStorage object from Flask request
        filepath: Path where file will be saved
        
    Returns:
        pandas DataFrame if validation passes
        
    Raises:
        Various CSVValidationError subclasses
    """
    # 1. Validate file type
    validate_file_type(file.filename)
    
    # 2. Validate file size
    validate_file_size(file)
    
    # 3. Save file temporarily
    file.save(filepath)
    
    try:
        # 4. Try to read CSV with multiple encodings
        df = None
        encodings = ['utf-8', 'ISO-8859-1', 'cp1252']
        
        for encoding in encodings:
            try:
                df = pd.read_csv(filepath, encoding=encoding)
                break
            except UnicodeDecodeError:
                continue
        
        if df is None:
            raise InvalidCSVFormatError("Unable to read CSV file. Please check file encoding.")
        
        # 5. Validate structure
        validate_csv_structure(df)
        
        # 6. Validate data sufficiency
        validate_data_sufficiency(df)
        
        return df
        
    except Exception as e:
        # Clean up file if validation fails
        if os.path.exists(filepath):
            os.remove(filepath)
        raise e
