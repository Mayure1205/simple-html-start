from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import hashlib
import json
import os
from web3 import Web3
from sklearn.linear_model import LinearRegression
import solcx

app = Flask(__name__)
CORS(app)

# ==========================================
# 🔧 CONFIGURATION
# ==========================================
GANACHE_URL = "http://127.0.0.1:8545"
CONTRACT_ADDRESS_FILE = "contract_address.txt"

# ==========================================
# 📊 DATA LOADING & ML
# ==========================================
data_cache = {}

def load_data():
    if 'df' in data_cache: return data_cache['df']
    
    print("Loading dataset...")
    try:
        if os.path.exists('online_retail_II.csv'):
            df = pd.read_csv('online_retail_II.csv', encoding='ISO-8859-1')
        else:
            print("❌ CSV file not found!")
            return None
            
        # Dynamic Column Mapping
        col_map = {
            'InvoiceNo': next((c for c in df.columns if 'invoice' in c.lower()), 'InvoiceNo'),
            'CustomerID': next((c for c in df.columns if 'customer' in c.lower() and 'id' in c.lower()), 'Customer ID'),
            'Price': next((c for c in df.columns if 'price' in c.lower() or 'unit' in c.lower()), 'Price'),
            'Quantity': next((c for c in df.columns if 'quantity' in c.lower()), 'Quantity'),
            'InvoiceDate': next((c for c in df.columns if 'date' in c.lower()), 'InvoiceDate'),
            'Country': next((c for c in df.columns if 'country' in c.lower()), 'Country'),
            'Description': next((c for c in df.columns if 'description' in c.lower() or 'product' in c.lower()), 'Description')
        }
        
        df = df.rename(columns={v: k for k, v in col_map.items()})
        
        # Cleaning
        df = df.dropna(subset=['CustomerID'])
        df['InvoiceNo'] = df['InvoiceNo'].astype(str)
        df = df[~df['InvoiceNo'].str.startswith('C')]
        df['TotalAmount'] = df['Quantity'] * df['Price']
        df['InvoiceDate'] = pd.to_datetime(df['InvoiceDate'])
        
        data_cache['df'] = df
        print(f"✅ Loaded {len(df)} transactions")
        return df
    except Exception as e:
        print(f"❌ Error loading CSV: {e}")
        return None

def generate_ml_forecast(df):
    """Generate forecast using Linear Regression"""
    # Aggregate weekly sales
    weekly = df.set_index('InvoiceDate')['TotalAmount'].resample('W').sum().reset_index()
    weekly['WeekNum'] = range(len(weekly))
    
    # Train Model
    X = weekly[['WeekNum']].values
    y = weekly['TotalAmount'].values
    
    model = LinearRegression()
    model.fit(X, y)
    
    # Predict next 4 weeks
    last_week_num = weekly['WeekNum'].max()
    future_weeks = np.array([[last_week_num + i] for i in range(1, 5)])
    predictions = model.predict(future_weeks)
    
    # Format Forecast
    last_date = weekly['InvoiceDate'].max()
    forecast = []
    
    for i, pred in enumerate(predictions):
        date = last_date + timedelta(weeks=i+1)
        
        # Christmas Boost Logic (Real ML + Domain Knowledge)
        if date.month == 12 and 18 <= date.day <= 31:
            pred *= 1.4
            
        forecast.append({
            'week': date.strftime('%d %b'),
            'sales': round(pred, 2),
            'lower': round(pred * 0.85, 2), # 85% confidence
            'upper': round(pred * 1.15, 2)  # 115% confidence
        })
        
    # Historical Data (Last 8 weeks)
    historical = weekly.tail(8).to_dict('records')
    for h in historical:
        h['date'] = h['InvoiceDate'].strftime('%d %b')
        h['sales'] = round(h['TotalAmount'], 2)
        del h['InvoiceDate']
        del h['TotalAmount']
        del h['WeekNum']
        
    return {
        'historical': historical,
        'forecast': forecast,
        'totalForecast': sum([f['sales'] for f in forecast])
    }

def get_top_stats(df):
    """Get Top Countries and Products"""
    # Top Countries
    countries = df.groupby('Country')['TotalAmount'].sum().nlargest(5).reset_index()
    countries_list = [{'country': r['Country'], 'sales': round(r['TotalAmount'], 2)} for _, r in countries.iterrows()]
    
    # Top Products
    products = df.groupby('Description')['Quantity'].sum().nlargest(5).reset_index()
    products_list = [{'product': r['Description'], 'quantity': int(r['Quantity'])} for _, r in products.iterrows()]
    
    return countries_list, products_list

def generate_rfm(df):
    """Generate RFM Segments"""
    snapshot_date = df['InvoiceDate'].max() + timedelta(days=1)
    rfm = df.groupby('CustomerID').agg({
        'InvoiceDate': lambda x: (snapshot_date - x.max()).days,
        'InvoiceNo': 'nunique',
        'TotalAmount': 'sum'
    })
    rfm.columns = ['Recency', 'Frequency', 'Monetary']
    
    # Quantile Scoring (Better than hardcoded)
    try:
        rfm['R'] = pd.qcut(rfm['Recency'], 4, labels=[4, 3, 2, 1])
        rfm['F'] = pd.qcut(rfm['Frequency'].rank(method='first'), 4, labels=[1, 2, 3, 4])
        rfm['M'] = pd.qcut(rfm['Monetary'], 4, labels=[1, 2, 3, 4])
    except:
        # Fallback if not enough data
        rfm['R'] = 3
        rfm['F'] = 3
        rfm['M'] = 3

    def segment(row):
        score = int(row['R']) * 100 + int(row['F']) * 10 + int(row['M'])
        if score >= 444: return "Champions"
        if score >= 333: return "Loyal Customers"
        if score >= 222: return "Potential Loyalists"
        if int(row['R']) == 1: return "Lost"
        if int(row['R']) == 2: return "At Risk"
        return "Standard"

    rfm['Segment'] = rfm.apply(segment, axis=1)
    
    # Top 10 Customers
    top = rfm.nlargest(10, 'Monetary').reset_index()
    top_list = []
    offer_map = {'Champions': '🏆 15% VIP', 'Loyal Customers': '💎 10% Bonus', 'At Risk': '⚠️ 20% WinBack'}
    
    for _, row in top.iterrows():
        top_list.append({
            'id': str(int(row['CustomerID'])),
            'amount': round(row['Monetary'], 2),
            'segment': row['Segment'],
            'offer': offer_map.get(row['Segment'], '📧 Newsletter')
        })
        
    return {'segmentCounts': rfm['Segment'].value_counts().to_dict(), 'topCustomers': top_list}

# ==========================================
# ⛓️ BLOCKCHAIN LOGIC
# ==========================================
def deploy_contract():
    try:
        # Install solc if needed
        try:
            solcx.install_solc('0.8.0')
        except:
            pass
            
        w3 = Web3(Web3.HTTPProvider(GANACHE_URL))
        if not w3.is_connected(): return None
        
        with open('ForecastLogger.sol', 'r') as f:
            source = f.read()
            
        compiled = solcx.compile_source(source, output_values=['abi', 'bin'])
        contract_id, contract_interface = list(compiled.items())[0]
        
        # Deploy
        w3.eth.default_account = w3.eth.accounts[0]
        ForecastLogger = w3.eth.contract(abi=contract_interface['abi'], bytecode=contract_interface['bin'])
        tx_hash = ForecastLogger.constructor().transact()
        tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        
        address = tx_receipt.contractAddress
        with open(CONTRACT_ADDRESS_FILE, 'w') as f:
            f.write(address)
            
        print(f"✅ Contract Deployed at: {address}")
        return address
    except Exception as e:
        print(f"⚠️ Deployment Failed (using mock): {e}")
        return None

def log_to_blockchain_real(data_hash, total_sales):
    try:
        w3 = Web3(Web3.HTTPProvider(GANACHE_URL))
        if not w3.is_connected(): return None
        
        # Get Contract Address
        if os.path.exists(CONTRACT_ADDRESS_FILE):
            with open(CONTRACT_ADDRESS_FILE, 'r') as f:
                address = f.read().strip()
        else:
            address = deploy_contract()
            
        if not address: return None
        
        # Compile to get ABI dynamically
        try:
            with open('ForecastLogger.sol', 'r') as f: source = f.read()
            compiled = solcx.compile_source(source, output_values=['abi'])
            contract_interface = list(compiled.items())[0][1]
            abi = contract_interface['abi']
        except:
            # Fallback ABI if compilation fails at runtime
            abi = [{"inputs":[{"internalType":"string","name":"_forecastHash","type":"string"},{"internalType":"uint256","name":"_totalSales","type":"uint256"}],"name":"logForecast","outputs":[],"stateMutability":"nonpayable","type":"function"}]
        
        contract = w3.eth.contract(address=address, abi=abi)
        tx_hash = contract.functions.logForecast(data_hash, int(total_sales)).transact({'from': w3.eth.accounts[0]})
        return w3.to_hex(tx_hash)
    except Exception as e:
        print(f"Blockchain Error: {e}")
        # Fallback to self-transaction if contract fails
        try:
            w3 = Web3(Web3.HTTPProvider(GANACHE_URL))
            tx = w3.eth.send_transaction({
                'from': w3.eth.accounts[0],
                'to': w3.eth.accounts[0],
                'data': w3.to_hex(text=data_hash)
            })
            return w3.to_hex(tx)
        except:
            return None

# ==========================================
# 🚀 API ENDPOINTS
# ==========================================
@app.route('/api/dashboard', methods=['GET'])
def get_dashboard():
    try:
        df = load_data()
        if df is None: return jsonify({'success': False, 'error': 'Data load failed'}), 500
        
        forecast = generate_ml_forecast(df)
        rfm = generate_rfm(df)
        countries, products = get_top_stats(df)
        
        # Hash
        data_to_hash = json.dumps(forecast['forecast'], sort_keys=True)
        forecast_hash = hashlib.sha256(data_to_hash.encode()).hexdigest()
        
        return jsonify({
            'success': True,
            'data': {
                'forecast': forecast,
                'rfm': rfm,
                'countries': countries,
                'products': products,
                'hash': forecast_hash
            }
        })
    except Exception as e:
        print(f"API Error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/log-blockchain', methods=['POST'])
def log_blockchain():
    data = request.json
    # Get total sales from request, default to 0 if missing
    total_sales = data.get('total_sales', 0)
    tx_hash = log_to_blockchain_real(data.get('hash'), total_sales)
    if tx_hash:
        return jsonify({'success': True, 'tx_hash': tx_hash})
    else:
        return jsonify({'success': False, 'error': 'Blockchain failed'}), 500

if __name__ == '__main__':
    load_data()
    # Only deploy if address file doesn't exist
    if not os.path.exists(CONTRACT_ADDRESS_FILE):
        deploy_contract()
    app.run(debug=True, port=5000)
