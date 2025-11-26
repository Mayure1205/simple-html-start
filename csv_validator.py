"""
CSV Validation Module
"""
import pandas as pd

class CSVValidationError(Exception):
    """Custom exception for CSV validation errors"""
    pass

def validate_uploaded_csv(file_path):
    """
    Validate uploaded CSV file
    
    Args:
        file_path: Path to CSV file
        
    Returns:
        True if valid
        
    Raises:
        CSVValidationError: If validation fails
    """
    try:
        df = pd.read_csv(file_path, encoding='ISO-8859-1')
        
        if len(df) == 0:
            raise CSVValidationError("CSV file is empty")
        
        if len(df.columns) < 2:
            raise CSVValidationError("CSV must have at least 2 columns")
        
        return True
        
    except pd.errors.EmptyDataError:
        raise CSVValidationError("CSV file is empty")
    except Exception as e:
        raise CSVValidationError(f"Invalid CSV file: {str(e)}")
