"""
Field Detection Module - Auto-detect CSV column mappings
"""
import pandas as pd
import numpy as np
from datetime import datetime

def detect_fields(df):
    """
    Auto-detect date, value, and optional fields in CSV
    
    Args:
        df: pandas DataFrame
        
    Returns:
        dict with 'mapping', 'confidence', 'warnings'
    """
    mapping = {
        'date': None,
        'value': None,
        'product': None,
        'region': None,
        'customer': None
    }
    warnings = []
    
    # Detect date column
    date_candidates = []
    for col in df.columns:
        try:
            # Try parsing as date
            pd.to_datetime(df[col], errors='coerce')
            non_null_ratio = df[col].notna().sum() / len(df)
            if non_null_ratio > 0.5:
                # Check if values look like dates
                if any(keyword in col.lower() for keyword in ['date', 'time', 'day', 'invoice']):
                    date_candidates.append((col, 10))  # High priority
                else:
                    date_candidates.append((col, 5))  # Medium priority
        except:
            pass
    
    if date_candidates:
        date_candidates.sort(key=lambda x: x[1], reverse=True)
        mapping['date'] = date_candidates[0][0]
    
    # Detect value column (numeric)
    value_candidates = []
    for col in df.columns:
        if col == mapping['date']:
            continue
        try:
            numeric_data = pd.to_numeric(df[col], errors='coerce')
            non_null_ratio = numeric_data.notna().sum() / len(df)
            if non_null_ratio > 0.5:
                # Prioritize columns with keywords
                priority = 0
                if any(keyword in col.lower() for keyword in ['amount', 'total', 'price', 'revenue', 'sales', 'value']):
                    priority = 10
                elif any(keyword in col.lower() for keyword in ['quantity', 'qty', 'count']):
                    priority = 7
                else:
                    priority = 5
                value_candidates.append((col, priority))
        except:
            pass
    
    if value_candidates:
        value_candidates.sort(key=lambda x: x[1], reverse=True)
        mapping['value'] = value_candidates[0][0]
    
    # Detect optional fields
    for col in df.columns:
        if col in [mapping['date'], mapping['value']]:
            continue
        
        col_lower = col.lower()
        
        # Product/Description
        if any(keyword in col_lower for keyword in ['product', 'description', 'item', 'sku']):
            if mapping['product'] is None:
                mapping['product'] = col
        
        # Region/Country
        elif any(keyword in col_lower for keyword in ['country', 'region', 'location', 'territory']):
            if mapping['region'] is None:
                mapping['region'] = col
        
        # Customer
        elif any(keyword in col_lower for keyword in ['customer', 'client', 'user']):
            if mapping['customer'] is None:
                mapping['customer'] = col
    
    # Determine confidence
    confidence = 'high'
    if not mapping['date']:
        warnings.append("Could not auto-detect date column")
        confidence = 'low'
    if not mapping['value']:
        warnings.append("Could not auto-detect value column")
        confidence = 'low'
    
    if confidence == 'high' and (not mapping['product'] and not mapping['region']):
        confidence = 'medium'
        warnings.append("No optional dimensions detected")
    
    return {
        'mapping': mapping,
        'confidence': confidence,
        'warnings': warnings
    }


def validate_and_clean_data(df, mapping):
    """
    Validate and clean data based on mapping
    
    Args:
        df: pandas DataFrame
        mapping: Column mapping dict
        
    Returns:
        Cleaned DataFrame
    """
    df_clean = df.copy()
    
    # Convert date column
    if mapping.get('date'):
        df_clean[mapping['date']] = pd.to_datetime(df_clean[mapping['date']], errors='coerce')
        df_clean = df_clean.dropna(subset=[mapping['date']])
    
    # Convert value column to numeric
    if mapping.get('value'):
        df_clean[mapping['value']] = pd.to_numeric(df_clean[mapping['value']], errors='coerce')
        df_clean = df_clean.dropna(subset=[mapping['value']])
    
    return df_clean
