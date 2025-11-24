"""
Automatic Field Detection for Universal CSV Support
Detects date, numeric, and categorical columns with smart heuristics.
"""
import pandas as pd
import numpy as np
from typing import Dict, List, Tuple


def detect_fields(df: pd.DataFrame) -> Dict:
    """
    Automatically detect column roles in a CSV.
    
    Returns:
        {
            'mapping': {'date': 'col_name', 'value': 'col_name', ...},
            'numeric_cols': [...],
            'date_cols': [...],
            'categorical_cols': [...],
            'confidence': 'high' | 'medium' | 'low',
            'warnings': [...]
        }
    """
    # 1️⃣ Clean column names
    df.columns = df.columns.str.strip()
    
    warnings = []
    
    # 2️⃣ Detect numeric columns (candidate metrics)
    numeric_cols = df.select_dtypes(include=['int64', 'float64', 'int32', 'float32']).columns.tolist()
    
    # 3️⃣ Detect date columns
    date_cols = []
    for col in df.columns:
        try:
            # Try parsing as datetime
            parsed = pd.to_datetime(df[col], errors='coerce')
            # If >80% of values parse successfully, it's a date column
            if parsed.notna().mean() > 0.8:
                date_cols.append(col)
        except Exception:
            continue
    
    # 4️⃣ Detect categorical columns (moderate cardinality)
    categorical_cols = []
    for col in df.select_dtypes(include=['object', 'string']).columns:
        unique_ratio = df[col].nunique() / len(df)
        # Between 0.1% and 20% unique values = good categorical
        if 0.001 < unique_ratio < 0.2:
            categorical_cols.append(col)
    
    # 5️⃣ Smart mapping with keyword heuristics
    mapping = {}
    confidence_scores = {}
    
    # --- DATE COLUMN (required) ---
    if date_cols:
        # Prefer columns with "date", "time", "timestamp" in name
        date_keywords = ['date', 'time', 'timestamp', 'dt', 'day']
        best_date = None
        best_score = 0
        
        for col in date_cols:
            score = sum(1 for kw in date_keywords if kw in col.lower())
            if score > best_score:
                best_score = score
                best_date = col
        
        mapping['date'] = best_date or date_cols[0]
        confidence_scores['date'] = 'high' if best_score > 0 else 'medium'
    else:
        warnings.append('No date column detected')
        confidence_scores['date'] = 'none'
    
    # --- VALUE COLUMN (required) ---
    if numeric_cols:
        # Prefer columns with "amount", "sales", "value", "price", "revenue", "total"
        value_keywords = ['amount', 'sales', 'value', 'price', 'revenue', 'total', 'sum']
        best_value = None
        best_score = 0
        
        for col in numeric_cols:
            score = sum(1 for kw in value_keywords if kw in col.lower())
            if score > best_score:
                best_score = score
                best_value = col
        
        mapping['value'] = best_value or numeric_cols[0]
        confidence_scores['value'] = 'high' if best_score > 0 else 'medium'
    else:
        warnings.append('No numeric value column detected')
        confidence_scores['value'] = 'none'
    
    # --- OPTIONAL GROUPING COLUMNS ---
    grouping_roles = {
        'product': ['product', 'description', 'item', 'sku', 'name'],
        'country': ['country', 'region', 'location', 'territory', 'area'],
        'customer': ['customer', 'client', 'user', 'account', 'id']
    }
    
    for role, keywords in grouping_roles.items():
        best_col = None
        best_score = 0
        
        for col in categorical_cols:
            score = sum(1 for kw in keywords if kw in col.lower())
            if score > best_score:
                best_score = score
                best_col = col
        
        if best_col:
            mapping[role] = best_col
            confidence_scores[role] = 'high' if best_score > 0 else 'low'
    
    # 6️⃣ Overall confidence assessment
    required_confidence = [confidence_scores.get('date', 'none'), 
                          confidence_scores.get('value', 'none')]
    
    if all(c == 'high' for c in required_confidence):
        overall_confidence = 'high'
    elif 'none' in required_confidence:
        overall_confidence = 'low'
    else:
        overall_confidence = 'medium'
    
    return {
        'mapping': mapping,
        'numeric_cols': numeric_cols,
        'date_cols': date_cols,
        'categorical_cols': categorical_cols,
        'confidence': overall_confidence,
        'confidence_scores': confidence_scores,
        'warnings': warnings
    }


def validate_and_clean_data(df: pd.DataFrame, mapping: Dict) -> Tuple[pd.DataFrame, List[str]]:
    """
    Clean and validate data based on detected mapping.
    
    Returns:
        (cleaned_df, warnings)
    """
    warnings = []
    
    # Clean date column
    if 'date' in mapping and mapping['date']:
        date_col = mapping['date']
        df[date_col] = pd.to_datetime(df[date_col], errors='coerce')
        null_dates = df[date_col].isna().sum()
        if null_dates > 0:
            warnings.append(f'{null_dates} rows have invalid dates and will be removed')
        df = df.dropna(subset=[date_col])
    
    # Clean value column
    if 'value' in mapping and mapping['value']:
        value_col = mapping['value']
        df[value_col] = pd.to_numeric(df[value_col], errors='coerce').fillna(0)
        negative_count = (df[value_col] < 0).sum()
        if negative_count > 0:
            warnings.append(f'{negative_count} rows have negative values')
    
    # Clean categorical columns
    for role in ['product', 'country', 'customer']:
        if role in mapping and mapping[role]:
            col = mapping[role]
            df[col] = df[col].astype(str).str.strip()
            # Replace empty strings with 'Unknown'
            df[col] = df[col].replace('', f'Unknown {role.title()}')
    
    return df, warnings
