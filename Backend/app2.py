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
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import solcx

# statsmodels for ARIMA
from statsmodels.tsa.arima.model import ARIMA
import warnings
warnings.filterwarnings("ignore")

app = Flask(_name_)
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
    if 'df' in data_cache:
        return data_cache['df']
    print("Loading dataset...")
    try:
        csv_path = 'online_retail_II.csv'
        if not os.path.exists(csv_path):
            print("❌ CSV file not found!")
            print(f"   Expected location: {os.path.abspath(csv_path)}")
            print("   Please download from: https://www.kaggle.com/datasets/mashlyn/online-retail-ii-uci")
            return None

        df = pd.read_csv(csv_path, encoding='ISO-8859-1')

        # Validate CSV has data
        if df.empty:
            print("❌ CSV file is empty!")
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
        if df.empty:
            print("❌ No valid customer data after cleaning!")
            return None

        df['InvoiceNo'] = df['InvoiceNo'].astype(str)
        df = df[~df['InvoiceNo'].str.startswith('C')]
        df['TotalAmount'] = df['Quantity'] * df['Price'] # added a new column total amount.
        df['InvoiceDate'] = pd.to_datetime(df['InvoiceDate'], errors='coerce')

        # Remove invalid dates
        df = df.dropna(subset=['InvoiceDate'])
        if df.empty:
            print("❌ No valid date data after cleaning!")
            return None

        data_cache['df'] = df
        print(f"✅ Loaded {len(df)} transactions")
        return df
    except Exception as e:
        print(f"❌ Error loading CSV: {e}")
        import traceback
        traceback.print_exc()
        return None

# Global Cache for ML Model (Train Once, Use Forever)
ML_MODEL_CACHE = {
    'forecast_data': None,
    'model': None,
    'metrics': None
}

def generate_ml_forecast(df):
    """Generate forecast using ARIMA on weekly aggregated sales"""
    global ML_MODEL_CACHE

    # Return cached result if available
    if ML_MODEL_CACHE['forecast_data'] is not None:
        print("✅ Using cached model")
        return ML_MODEL_CACHE['forecast_data']

    # Aggregate weekly sales
    weekly = df.set_index('InvoiceDate')['TotalAmount'].resample('W').sum().reset_index()

    # Filter out obviously tiny weeks (noise)
    weekly = weekly[weekly['TotalAmount'] > 100]

    if len(weekly) < 8:
        # Not enough weekly points for ARIMA: try daily aggregation fallback or raise
        # Try daily aggregation if weekly insufficient but daily might help
        daily = df.set_index('InvoiceDate')['TotalAmount'].resample('D').sum().reset_index()
        daily = daily[daily['TotalAmount'] > 0]
        if len(daily) >= 30:
            # Convert daily to weekly to keep output consistent
            weekly = daily.set_index('InvoiceDate')['TotalAmount'].resample('W').sum().reset_index()
        else:
            raise ValueError("Insufficient weekly/daily data for forecasting.")

    if len(weekly) < 6:
        raise ValueError("Insufficient weekly data for forecasting.")

    weekly = weekly.reset_index(drop=True)
    weekly['WeekNum'] = range(len(weekly))

    # Prepare series for ARIMA
    series = weekly.set_index('InvoiceDate')['TotalAmount'].asfreq('W')

    # Fit ARIMA with safe defaults
    model = None
    predictions = None
    try:
        # use a simple ARIMA(1,1,1) - robust default
        arima_order = (1, 1, 1)
        arima_model = ARIMA(series, order=arima_order)
        arima_res = arima_model.fit()
        # Forecast next 4 weeks (steps=4)
        preds = arima_res.get_forecast(steps=4)
        pred_values = preds.predicted_mean.values
    except Exception as e:
        print(f"ARIMA failed: {e}. Falling back to linear regression on WeekNum.")
        # Fallback: simple Linear Regression on week index
        X = weekly[['WeekNum']].values
        y = weekly['TotalAmount'].values
        lr = LinearRegression()
        lr.fit(X, y)
        last_week_num = weekly['WeekNum'].max()
        future_weeks = np.array([[last_week_num + i] for i in range(1, 5)])
        pred_values = lr.predict(future_weeks)
        arima_res = None

    # Format Forecast
    last_date = weekly['InvoiceDate'].max()
    forecast = []

    for i, pred in enumerate(pred_values):
        date = last_date + timedelta(weeks=i+1)

        # Christmas Boost Logic (same as before)
        if date.month == 12 and 18 <= date.day <= 31:
            pred *= 1.4

        forecast.append({
            'week': date.strftime('%d %b'),
            'sales': round(float(pred), 2),
            'lower': round(float(pred) * 0.85, 2),
            'upper': round(float(pred) * 1.15, 2)
        })

    # Historical Data (Last 8 weeks)
    hist = weekly.tail(8).copy()
    historical = []
    for _, h in hist.iterrows():
        historical.append({
            'date': h['InvoiceDate'].strftime('%d %b'),
            'sales': round(float(h['TotalAmount']), 2)
        })

    # Store in Cache
    result = {
        'historical': historical,
        'forecast': forecast,
        'totalForecast': round(sum([f['sales'] for f in forecast]), 2)
    }

    ML_MODEL_CACHE['forecast_data'] = result
    ML_MODEL_CACHE['model'] = arima_res  # could be None if fallback used

    return result


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
    """Generate customer segmentation using RFM -> KMeans clustering"""
    # Snapshot date for Recency calculation
    snapshot_date = df['InvoiceDate'].max() + timedelta(days=1)

    rfm = df.groupby('CustomerID').agg({
        'InvoiceDate': lambda x: (snapshot_date - x.max()).days,
        'InvoiceNo': 'nunique',
        'TotalAmount': 'sum'
    }).reset_index()

    if rfm.empty:
        return {'segmentCounts': {}, 'topCustomers': []}

    rfm.columns = ['CustomerID', 'Recency', 'Frequency', 'Monetary']

    # Some customers might have zero/negative monetary due to returns; clip
    rfm['Monetary'] = rfm['Monetary'].clip(lower=0.0)

    # Features for clustering: Recency (smaller better), Frequency, Monetary
    # We will scale features and inverse recency so higher is better where appropriate
    features = rfm[['Recency', 'Frequency', 'Monetary']].copy()

    # To make Recency align with other 'higher is better' features, take negative recency
    features['RecencyInv'] = -features['Recency']

    X = features[['RecencyInv', 'Frequency', 'Monetary']].values

    # Standardize
    scaler = StandardScaler()
    try:
        X_scaled = scaler.fit_transform(X)
    except Exception as e:
        print(f"Scaling failed: {e}. Falling back to simple quantile RFM segmentation.")
        # Fallback: quantile-based RFM scoring
        try:
            rfm['R'] = pd.qcut(rfm['Recency'], 4, labels=[4,3,2,1])
            rfm['F'] = pd.qcut(rfm['Frequency'].rank(method='first'), 4, labels=[1,2,3,4])
            rfm['M'] = pd.qcut(rfm['Monetary'], 4, labels=[1,2,3,4])
            rfm['Segment'] = (rfm['R'].astype(int)*100 + rfm['F'].astype(int)*10 + rfm['M'].astype(int)).apply(
                lambda s: "Champions" if s>=444 else ("Loyal Customers" if s>=333 else ("Potential Loyalists" if s>=222 else "Standard")))
            top = rfm.nlargest(10, 'Monetary')
            top_list = []
            offer_map = {'Champions': '🏆 15% VIP', 'Loyal Customers': '💎 10% Bonus', 'At Risk': '⚠ 20% WinBack'}
            for _, row in top.iterrows():
                top_list.append({
                    'id': str(int(row['CustomerID'])),
                    'amount': round(float(row['Monetary']), 2),
                    'segment': row['Segment'],
                    'offer': offer_map.get(row['Segment'], '📧 Newsletter')
                })
            return {'segmentCounts': rfm['Segment'].value_counts().to_dict(), 'topCustomers': top_list}
        except Exception as ex:
            print(f"Fallback quantile segmentation also failed: {ex}")
            return {'segmentCounts': {}, 'topCustomers': []}

    # KMeans clustering (choose k dynamically based on data size)
    n_customers = len(rfm)
    k = 4 if n_customers >= 4 else 1

    # Fit KMeans with retries for stability
    try:
        kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
        clusters = kmeans.fit_predict(X_scaled)
    except Exception as e:
        print(f"KMeans failed: {e}. Falling back to quantile RFM segmentation.")
        # Same fallback as above
        try:
            rfm['R'] = pd.qcut(rfm['Recency'], 4, labels=[4,3,2,1])
            rfm['F'] = pd.qcut(rfm['Frequency'].rank(method='first'), 4, labels=[1,2,3,4])
            rfm['M'] = pd.qcut(rfm['Monetary'], 4, labels=[1,2,3,4])
            rfm['Segment'] = (rfm['R'].astype(int)*100 + rfm['F'].astype(int)*10 + rfm['M'].astype(int)).apply(
                lambda s: "Champions" if s>=444 else ("Loyal Customers" if s>=333 else ("Potential Loyalists" if s>=222 else "Standard")))
            top = rfm.nlargest(10, 'Monetary')
            top_list = []
            offer_map = {'Champions': '🏆 15% VIP', 'Loyal Customers': '💎 10% Bonus', 'At Risk': '⚠ 20% WinBack'}
            for _, row in top.iterrows():
                top_list.append({
                    'id': str(int(row['CustomerID'])),
                    'amount': round(float(row['Monetary']), 2),
                    'segment': row['Segment'],
                    'offer': offer_map.get(row['Segment'], '📧 Newsletter')
                })
            return {'segmentCounts': rfm['Segment'].value_counts().to_dict(), 'topCustomers': top_list}
        except:
            return {'segmentCounts': {}, 'topCustomers': []}

    rfm['Cluster'] = clusters

    # Interpret clusters: compute cluster medians to label them
    cluster_summary = rfm.groupby('Cluster').agg({
        'Recency': 'median',
        'Frequency': 'median',
        'Monetary': 'median'
    }).reset_index()

    # We'll map clusters to human-friendly segments:
    # Heuristic:
    # - High Monetary & High Frequency -> "Top Spenders"
    # - Low Recency (recent) & moderate Monetary -> "Active"
    # - High Recency (not recent) & decent Monetary -> "At Risk"
    # - Low Monetary & Low Frequency -> "Low Value"
    cluster_labels = {}
    # create a score to rank clusters: higher score -> better customers
    cluster_summary['score'] = (
        (-cluster_summary['Recency'].fillna(cluster_summary['Recency'].max())) * 0.4 +
        cluster_summary['Frequency'].fillna(0) * 0.3 +
        cluster_summary['Monetary'].fillna(0) * 0.3
    )

    # Rank clusters by score descending
    ranked = cluster_summary.sort_values('score', ascending=False).reset_index(drop=True)

    # Assign names based on rank
    name_map = {}
    if len(ranked) == 1:
        name_map[ranked.loc[0, 'Cluster']] = "Top Spenders"
    elif len(ranked) == 2:
        name_map[ranked.loc[0, 'Cluster']] = "Top Spenders"
        name_map[ranked.loc[1, 'Cluster']] = "At Risk"
    elif len(ranked) == 3:
        name_map[ranked.loc[0, 'Cluster']] = "Top Spenders"
        name_map[ranked.loc[1, 'Cluster']] = "Active"
        name_map[ranked.loc[2, 'Cluster']] = "Low Value"
    else:
        # 4 or more clusters
        name_map[ranked.loc[0, 'Cluster']] = "Top Spenders"
        name_map[ranked.loc[1, 'Cluster']] = "Loyal Customers"
        name_map[ranked.loc[2, 'Cluster']] = "At Risk"
        # remaining clusters -> Low Value
        for idx in range(3, len(ranked)):
            name_map[ranked.loc[idx, 'Cluster']] = "Low Value"

    # Map cluster -> label
    rfm['Segment'] = rfm['Cluster'].map(name_map)

    # Segment counts
    segment_counts = rfm['Segment'].value_counts().to_dict()

    # Top 10 customers by Monetary
    top = rfm.nlargest(10, 'Monetary').reset_index(drop=True)
    top_list = []
    offer_map = {
        'Top Spenders': '🏆 15% VIP',
        'Loyal Customers': '💎 10% Bonus',
        'At Risk': '⚠ 20% WinBack',
        'Low Value': '📧 Re-engage: 10% off',
        'Active': '🎁 Small Reward'
    }

    for _, row in top.iterrows():
        seg = row['Segment'] if pd.notnull(row['Segment']) else 'Standard'
        top_list.append({
            'id': str(int(row['CustomerID'])),
            'amount': round(float(row['Monetary']), 2),
            'segment': seg,
            'offer': offer_map.get(seg, '📧 Newsletter')
        })

    return {'segmentCounts': segment_counts, 'topCustomers': top_list}


# ==========================================
# ⛓ BLOCKCHAIN LOGIC
# (kept identical to your original implementation)
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
        print(f"⚠ Deployment Failed (using mock): {e}")
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

        # Check if hash already exists (prevent duplicate logging)
        try:
            is_logged = contract.functions.isHashLogged(data_hash).call()
            if is_logged:
                print(f"⚠ Hash {data_hash[:16]}... already logged to blockchain")
                return "ALREADY_LOGGED"
        except:
            # If function doesn't exist (old contract), continue anyway
            pass

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
# 🚀 API ENDPOINTS (keep same signatures & payloads)
# ==========================================
@app.route('/api/dashboard', methods=['GET'])
def get_dashboard():
    try:
        df = load_data()
        if df is None:
            return jsonify({
                'success': False,
                'error': 'Data load failed. Please ensure online_retail_II.csv exists in the project root directory.'
            }), 500

        # Get date range from query parameters
        from_date = request.args.get('from')
        to_date = request.args.get('to')

        # Filter data by date range if provided
        if from_date or to_date:
            if from_date:
                from_dt = pd.to_datetime(from_date)
                df = df[df['InvoiceDate'] >= from_dt]
            if to_date:
                to_dt = pd.to_datetime(to_date)
                df = df[df['InvoiceDate'] <= to_dt]

            # Clear cache when date range changes (force retrain with filtered data)
            global ML_MODEL_CACHE
            ML_MODEL_CACHE = {'forecast_data': None, 'model': None, 'metrics': None}

        # Validate we have enough data for forecasting
        if len(df) < 10:
            return jsonify({
                'success': False,
                'error': 'Insufficient data for forecasting. Need at least 10 transactions.'
            }), 500

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
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Server error: {str(e)}'}), 500

@app.route('/api/log-blockchain', methods=['POST'])
def log_blockchain():
    try:
        data = request.json
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400

        # Get total sales from request, default to 0 if missing
        total_sales = data.get('total_sales', 0)
        data_hash = data.get('hash')

        if not data_hash:
            return jsonify({'success': False, 'error': 'Hash is required'}), 400

        tx_hash = log_to_blockchain_real(data_hash, total_sales)
        if tx_hash == "ALREADY_LOGGED":
            return jsonify({
                'success': False,
                'error': 'This forecast hash has already been logged to blockchain. Each unique forecast can only be logged once.',
                'already_logged': True
            }), 400
        elif tx_hash:
            return jsonify({'success': True, 'tx_hash': tx_hash})
        else:
            return jsonify({
                'success': False,
                'error': 'Blockchain connection failed. Please ensure Ganache is running on port 8545.'
            }), 500
    except Exception as e:
        print(f"Blockchain API Error: {e}")
        return jsonify({'success': False, 'error': f'Blockchain error: {str(e)}'}), 500

if _name_ == '_main_':
    load_data()
    # Only deploy if address file doesn't exist
    if not os.path.exists(CONTRACT_ADDRESS_FILE):
        deploy_contract()
    app.run(debug=True, port=5000)