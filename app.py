from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import hashlib
import json
import os
from web3 import Web3

app = Flask(__name__)
CORS(app)  # Enable CORS for React

# Load and cache data
data_cache = {}

def load_data():
    """Load and clean the dataset"""
    if 'df' in data_cache:
        return data_cache['df']
    
    print("Loading dataset...")
    try:
        # Check if file exists in current directory
        if os.path.exists('online_retail_II.csv'):
            df = pd.read_csv('online_retail_II.csv', encoding='ISO-8859-1')
        else:
            print("❌ CSV file not found!")
            return None
    except Exception as e:
        print(f"❌ Error loading CSV: {e}")
        return None
    
    # Clean data
    print(f"Columns found: {df.columns.tolist()}")
    
    # Map columns dynamically
    col_map = {
        'InvoiceNo': next((c for c in df.columns if 'invoice' in c.lower()), 'InvoiceNo'),
        'CustomerID': next((c for c in df.columns if 'customer' in c.lower() and 'id' in c.lower()), 'Customer ID'),
        'Price': next((c for c in df.columns if 'price' in c.lower() or 'unit' in c.lower()), 'Price'),
        'Quantity': next((c for c in df.columns if 'quantity' in c.lower()), 'Quantity'),
        'InvoiceDate': next((c for c in df.columns if 'date' in c.lower()), 'InvoiceDate')
    }
    
    print(f"Mapped columns: {col_map}")
    
    # Rename to standard names
    df = df.rename(columns={
        col_map['InvoiceNo']: 'InvoiceNo',
        col_map['CustomerID']: 'Customer ID',
        col_map['Price']: 'Price',
        col_map['Quantity']: 'Quantity',
        col_map['InvoiceDate']: 'InvoiceDate'
    })

    df = df.dropna(subset=['Customer ID'])
    df['InvoiceNo'] = df['InvoiceNo'].astype(str)
    df = df[~df['InvoiceNo'].str.startswith('C')]
    
    df['TotalAmount'] = df['Quantity'] * df['Price']
    
    # Convert date
    df['InvoiceDate'] = pd.to_datetime(df['InvoiceDate'])
    
    data_cache['df'] = df
    print(f"Loaded {len(df)} transactions")
    return df

def generate_forecast(df):
    """Generate sales forecast"""
    weekly_sales = df.set_index('InvoiceDate')['TotalAmount'].resample('W').sum().reset_index()
    weekly_sales.columns = ['Date', 'Sales']
    
    recent = weekly_sales.tail(10)
    avg_sales = recent['Sales'].mean()
    trend = (recent['Sales'].iloc[-1] - recent['Sales'].iloc[0]) / len(recent)
    
    last_date = recent['Date'].max()
    future_dates = [last_date + timedelta(weeks=i+1) for i in range(5)]
    
    forecast = []
    for i, date in enumerate(future_dates):
        base_sales = avg_sales + (trend * (i + 1))
        if date.month == 12 and 18 <= date.day <= 31:
            base_sales *= 1.5 # Christmas boost
        
        forecast.append({
            'week': date.strftime('%d %b'),
            'sales': round(base_sales, 2),
            'lower': round(base_sales * 0.9, 2),
            'upper': round(base_sales * 1.1, 2)
        })
    
    historical = recent.tail(7).to_dict('records')
    for h in historical:
        h['date'] = h['Date'].strftime('%d %b')
        h['sales'] = round(h['Sales'], 2)
        del h['Date']
    
    return {
        'historical': historical,
        'forecast': forecast,
        'totalForecast': sum([f['sales'] for f in forecast])
    }

def generate_rfm(df):
    """Generate RFM segments"""
    snapshot_date = df['InvoiceDate'].max() + timedelta(days=1)
    rfm = df.groupby('Customer ID').agg({
        'InvoiceDate': lambda x: (snapshot_date - x.max()).days,
        'InvoiceNo': 'nunique',
        'TotalAmount': 'sum'
    })
    rfm.rename(columns={'InvoiceDate': 'Recency', 'InvoiceNo': 'Frequency', 'TotalAmount': 'Monetary'}, inplace=True)
    
    # Simple segmentation logic
    def segment_customer(row):
        if row['Monetary'] > 5000 and row['Frequency'] > 10: return "Champions"
        if row['Frequency'] > 5: return "Loyal Customers"
        if row['Recency'] > 90: return "At Risk"
        if row['Recency'] < 30 and row['Frequency'] <= 2: return "New Customers"
        return "Standard"
        
    rfm['Segment'] = rfm.apply(segment_customer, axis=1)
    
    # Top 10
    top_customers = rfm.nlargest(10, 'Monetary').reset_index()
    top_list = []
    offer_map = {'Champions': '🏆 15% VIP', 'Loyal Customers': '💎 10% Bonus', 'At Risk': '⚠️ 20% Off'}
    
    for _, row in top_customers.iterrows():
        top_list.append({
            'id': str(row['Customer ID']),
            'amount': round(row['Monetary'], 2),
            'segment': row['Segment'],
            'offer': offer_map.get(row['Segment'], '📧 Newsletter')
        })
        
    return {'segmentCounts': rfm['Segment'].value_counts().to_dict(), 'topCustomers': top_list}

# Blockchain Logic (Simplified for integration)
def log_to_blockchain_mock(data_hash):
    # Connect to Ganache
    w3 = Web3(Web3.HTTPProvider('http://127.0.0.1:8545'))
    if not w3.is_connected():
        return None
    
    # In a real app, we would call the contract here.
    # For the hackathon demo, we generate a real TX hash by sending 0 ETH to ourselves
    # This proves we connected to the blockchain!
    try:
        accounts = w3.eth.accounts
        tx_hash = w3.eth.send_transaction({
            'from': accounts[0],
            'to': accounts[0],
            'value': 0,
            'data': w3.to_hex(text=data_hash) # Store hash in input data
        })
        return w3.to_hex(tx_hash)
    except Exception as e:
        print(f"Blockchain Error: {e}")
        return None

@app.route('/api/dashboard', methods=['GET'])
def get_dashboard_data():
    try:
        df = load_data()
        if df is None:
            return jsonify({'success': False, 'error': 'Data load failed'}), 500
            
        forecast = generate_forecast(df)
        rfm = generate_rfm(df)
        
        # Hash
        forecast_hash = hashlib.sha256(json.dumps(forecast['forecast'], sort_keys=True).encode()).hexdigest()
        
        return jsonify({
            'success': True,
            'data': {
                'forecast': forecast,
                'rfm': rfm,
                'hash': forecast_hash
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/log-blockchain', methods=['POST'])
def log_blockchain():
    data = request.json
    tx_hash = log_to_blockchain_mock(data.get('hash'))
    if tx_hash:
        return jsonify({'success': True, 'tx_hash': tx_hash})
    else:
        return jsonify({'success': False, 'error': 'Blockchain failed'}), 500

if __name__ == '__main__':
    load_data()
    app.run(debug=True, port=5000)
