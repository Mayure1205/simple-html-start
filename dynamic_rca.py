"""
Dynamic Root Cause Analysis Engine
Works with any detected column mapping - no hardcoded field names.
"""
import pandas as pd
from datetime import timedelta


def analyze_root_cause_dynamic(df, mapping):
    """
    Fully dynamic RCA that adapts to available columns.
    
    Args:
        df: DataFrame with data
        mapping: Dict with detected column mapping {'date': 'col', 'value': 'col', ...}
    
    Returns:
        RCA results dict or None if insufficient data
    """
    try:
        # The DataFrame from load_data() already has standardized column names
        # So we should use those instead of the raw mapping names
        date_col = 'InvoiceDate'
        value_col = 'TotalAmount'
        
        # Ensure columns exist in DataFrame
        if date_col not in df.columns or value_col not in df.columns:
            print(f"❌ Required standardized columns (InvoiceDate, TotalAmount) not found in data")
            print(f"   Available columns: {df.columns.tolist()}")
            return None
        
        # 1️⃣ Setup time periods (last 28 days vs previous 28 days)
        last_date = df[date_col].max()
        cutoff_current = last_date - timedelta(days=28)
        cutoff_previous = cutoff_current - timedelta(days=28)
        
        current_period = df[df[date_col] > cutoff_current]
        previous_period = df[(df[date_col] <= cutoff_current) & (df[date_col] > cutoff_previous)]
        
        if current_period.empty or previous_period.empty:
            print("❌ Insufficient data for period comparison")
            return None
        
        # 2️⃣ Calculate overall change
        curr_total = current_period[value_col].sum()
        prev_total = previous_period[value_col].sum()
        change = curr_total - prev_total
        pct_change = (change / prev_total) * 100 if prev_total > 0 else 0
        
        # 3️⃣ Dynamically detect available grouping columns
        # Map internal roles to standardized column names
        role_to_std_col = {
            'product': 'Description',
            'country': 'Country',
            'customer': 'CustomerID'
        }
        
        available_groupings = {}
        
        for role, std_col in role_to_std_col.items():
            # Check if this role was mapped AND the standardized column exists
            if role in mapping and mapping[role] and std_col in df.columns:
                available_groupings[role] = std_col
        
        # 4️⃣ Compute drivers for each available grouping
        drivers = {}
        
        for role, col_name in available_groupings.items():
            try:
                # Group by this dimension
                curr_sum = current_period.groupby(col_name)[value_col].sum()
                prev_sum = previous_period.groupby(col_name)[value_col].sum()
                
                # Align indexes
                all_keys = curr_sum.index.union(prev_sum.index)
                curr_sum = curr_sum.reindex(all_keys, fill_value=0)
                prev_sum = prev_sum.reindex(all_keys, fill_value=0)
                
                # Calculate variance
                variance = (curr_sum - prev_sum).sort_values(ascending=False)
                
                if len(variance) > 0:
                    drivers[role] = {
                        'top_gainer': {
                            'name': str(variance.index[0]),
                            'amount': round(float(variance.iloc[0]), 2)
                        },
                        'top_loser': {
                            'name': str(variance.index[-1]),
                            'amount': round(float(variance.iloc[-1]), 2)
                        }
                    }
            except Exception as e:
                print(f"⚠️ Could not compute driver for {role}: {e}")
                continue
        
        # 5️⃣ Build human-readable explanation
        status = "Growth" if change > 0 else "Decline"
        explanation = f"Value showed {status} of {abs(pct_change):.1f}% ({abs(change):,.0f} units). "
        
        # Find the most impactful driver
        if drivers:
            impact_role = max(
                drivers.keys(),
                key=lambda r: abs(drivers[r]['top_gainer']['amount'])
            )
            
            gainer = drivers[impact_role]['top_gainer']
            loser = drivers[impact_role]['top_loser']
            
            reasons = []
            if gainer['amount'] > 0:
                reasons.append(f"driven by '{gainer['name']}' (+{gainer['amount']:,.0f})")
            if loser['amount'] < 0:
                reasons.append(f"offset by drop in '{loser['name']}' ({loser['amount']:,.0f})")
            
            if reasons:
                explanation += " Mainly " + ", and ".join(reasons) + "."
        else:
            explanation += " No detailed breakdown available (missing grouping columns)."
        
        # 6️⃣ Build result object
        result = {
            'period': 'Last 28 Days vs Previous',
            'change_amount': round(change, 2),
            'change_percent': round(pct_change, 2),
            'explanation': explanation,
            'drivers': drivers,  # Dynamic drivers based on available columns
            'available_groupings': list(available_groupings.keys())
        }
        
        # Add legacy fields for backward compatibility
        if 'product' in drivers:
            result['top_gainer'] = drivers['product']['top_gainer']
            result['top_loser'] = drivers['product']['top_loser']
        
        if 'country' in drivers:
            result['top_country'] = drivers['country']['top_gainer']['name']
        
        if 'customer' in drivers:
            result['top_customer'] = drivers['customer']['top_gainer']['name']
        
        return result
        
    except Exception as e:
        print(f"❌ Error in dynamic RCA: {e}")
        import traceback
        traceback.print_exc()
        return None
