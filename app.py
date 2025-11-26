import os
import pandas as pd
import numpy as np
from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.utils import secure_filename
import hashlib
import json
from web3 import Web3
from datetime import datetime, timedelta
import time
import uuid

# Custom modules
from csv_validator import validate_uploaded_csv
from exceptions import CSVValidationError
from field_detector import detect_fields, validate_and_clean_data
from dynamic_rca import analyze_root_cause_dynamic

# Enhanced ML forecasting module
from ml.forecast import generate_ml_forecast

# SUI Blockchain adapter
from suiblockchain import log_forecast_to_sui

app = Flask(__name__)

# FIXED SEC-004: Restrict CORS to specific origins
ALLOWED_ORIGINS = os.getenv('ALLOWED_ORIGINS', 'http://localhost:3000,http://localhost:5173').split(',')
CORS(app, resources={r"/api/*": {"origins": ALLOWED_ORIGINS}})

# ==========================================
# 🔧 CONFIGURATION
# ==========================================
# FIXED SEC-005: Use environment variables instead of hardcoded values
GANACHE_URL = os.getenv('BLOCKCHAIN_URL', "http://127.0.0.1:8545")
CONTRACT_ADDRESS_FILE = "contract_address.txt"

# CSV Upload Configuration
UPLOAD_FOLDER = 'uploads'
DEFAULT_CSV = None
CURRENT_CSV_FILE = None
CURRENT_MAPPING = {}

# FIXED SEC-002: File upload security
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB limit
ALLOWED_EXTENSIONS = {'csv', 'txt'}

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Create uploads folder if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ==========================================
# 📊 DATA LOADING & ML
# ==========================================
data_cache = {}


def _format_metric_label(column_name):
    """Convert raw column name to a human-friendly label"""
    if not column_name:
        return "Metric"
    label = column_name.replace("_", " ").replace("-", " ").strip()
    return label.title() if label else "Metric"


def load_data(csv_filename=None):
    """
    Load CSV data with caching support and dynamic mapping
    """
    global CURRENT_CSV_FILE, CURRENT_MAPPING
    
    # Determine which CSV to load
    if csv_filename is None:
        csv_filename = CURRENT_CSV_FILE
    
    # If still None, no CSV uploaded yet
    if csv_filename is None:
        print("❌ No CSV file uploaded yet")
        return None
    
    # Check cache (different cache key for each file AND mapping)
    mapping_key = json.dumps(CURRENT_MAPPING, sort_keys=True)
    cache_key = f'df_{csv_filename}_{mapping_key}'
    
    if cache_key in data_cache:
        print(f"✅ Using cached data for {csv_filename}")
        return data_cache[cache_key]
    
    print(f"Loading dataset: {csv_filename}...")
    try:
        # Determine file path (check uploads folder first, then root)
        if os.path.exists(os.path.join(UPLOAD_FOLDER, csv_filename)):
            csv_path = os.path.join(UPLOAD_FOLDER, csv_filename)
        elif os.path.exists(csv_filename):
            csv_path = csv_filename
        else:
            print(f"❌ CSV file not found: {csv_filename}")
            return None
        
        # Try multiple encodings
        df = None
        for encoding in ['ISO-8859-1', 'utf-8', 'cp1252']:
            try:
                df = pd.read_csv(csv_path, encoding=encoding)
                break
            except UnicodeDecodeError:
                continue
        
        if df is None:
            print("❌ Unable to read CSV with any encoding!")
            return None
        
        # Validate CSV has data
        if df.empty:
            print("❌ CSV file is empty!")
            return None
        
        # ==========================================
        # 🧠 DYNAMIC MAPPING LOGIC
        # ==========================================
        if CURRENT_MAPPING:
            print(f"Applying mapping: {CURRENT_MAPPING}")
            
            # 1. Rename required columns
            rename_map = {
                CURRENT_MAPPING['date']: 'InvoiceDate',
                CURRENT_MAPPING['value']: 'TotalAmount'
            }
            
            # 2. Rename optional columns if present
            if 'product' in CURRENT_MAPPING and CURRENT_MAPPING['product'] and CURRENT_MAPPING['product'] != 'none':
                rename_map[CURRENT_MAPPING['product']] = 'Description'
            
            if 'region' in CURRENT_MAPPING and CURRENT_MAPPING['region'] and CURRENT_MAPPING['region'] != 'none':
                rename_map[CURRENT_MAPPING['region']] = 'Country'
                
            if 'customer' in CURRENT_MAPPING and CURRENT_MAPPING['customer'] and CURRENT_MAPPING['customer'] != 'none':
                rename_map[CURRENT_MAPPING['customer']] = 'CustomerID'
                
            df = df.rename(columns=rename_map)
            
        # Ensure InvoiceNo exists (needed for RFM frequency)
        if 'InvoiceNo' not in df.columns:
            df['InvoiceNo'] = df.index.astype(str)

        # Cleaning
        df['TotalAmount'] = pd.to_numeric(df['TotalAmount'], errors='coerce').fillna(0)
        df['InvoiceDate'] = pd.to_datetime(df['InvoiceDate'], errors='coerce')
        
        # Remove invalid dates
        df = df.dropna(subset=['InvoiceDate'])
        if df.empty:
            print("❌ No valid date data after cleaning!")
            return None
        
        data_cache[cache_key] = df
        print(f"✅ Loaded {len(df)} transactions from {csv_filename}")
        return df
    except Exception as e:
        print(f"❌ Error loading CSV: {e}")
        import traceback
        traceback.print_exc()
        return None


# Note: generate_ml_forecast is now imported from ml.forecast module
# The new implementation includes:
# - Auto-switching models (Prophet/SARIMAX/Baseline)
# - Rolling-origin backtesting
# - Anomaly detection
# - Robust confidence flags
# See ml/forecast.py for implementation details

def analyze_root_cause(df):
    """
    Analyze WHY sales changed.
    Compares Last 4 Weeks vs Previous 4 Weeks.
    """
    try:
        # 1. Setup Dates
        last_date = df['InvoiceDate'].max()
        cutoff_current = last_date - timedelta(days=28)
        cutoff_previous = cutoff_current - timedelta(days=28)
        
        # 2. Split Data
        current_period = df[df['InvoiceDate'] > cutoff_current]
        previous_period = df[(df['InvoiceDate'] <= cutoff_current) & (df['InvoiceDate'] > cutoff_previous)]
        
        if current_period.empty or previous_period.empty:
            return None

        # 3. Calculate Totals
        curr_total = current_period['TotalAmount'].sum()
        prev_total = previous_period['TotalAmount'].sum()
        change = curr_total - prev_total
        pct_change = (change / prev_total) * 100 if prev_total > 0 else 0
        
        # 4. Analyze by Product (Top Drivers)
            
        explanation = insight + " Mainly " + ", and ".join(reasons) + "."
        
        return {
            'period': 'Last 28 Days vs Previous',
            'change_amount': round(change, 2),
            'change_percent': round(pct_change, 2),
            'top_gainer': {'name': top_gainer, 'amount': round(top_gainer_amt, 2)},
            'top_loser': {'name': top_loser, 'amount': round(top_loser_amt, 2)},
            'top_country': top_country_change,
            'explanation': explanation
        }
        
    except Exception as e:
        print(f"❌ Error in RCA: {e}")
        return None

def get_top_stats(df):
    """Get Top Countries and Products"""
    countries_data = []
    products_data = []

    if 'Country' in df.columns:
        countries = df.groupby('Country')['TotalAmount'].sum().sort_values(ascending=False).head(5)
        countries_data = [{'country': c, 'value': round(s, 2)} for c, s in countries.items()]

    if 'Description' in df.columns:
        products = df.groupby('Description')['TotalAmount'].sum().sort_values(ascending=False).head(5)
        products_data = [{'product': p, 'value': round(q, 2)} for p, q in products.items()]

    return countries_data, products_data

def calculate_rfm(df, has_customer_dimension=True):
    """Calculate RFM Segments"""
    if not has_customer_dimension or 'CustomerID' not in df.columns:
        return {
            'available': False,
            'segmentCounts': {},
            'topCustomers': []
        }

    # Calculate RFM metrics
    current_date = df['InvoiceDate'].max()
    
    rfm = df.groupby('CustomerID').agg({
        'InvoiceDate': lambda x: (current_date - x.max()).days,
        'InvoiceNo': 'count',
        'TotalAmount': 'sum'
    }).rename(columns={
        'InvoiceDate': 'Recency',
        'InvoiceNo': 'Frequency',
        'TotalAmount': 'Monetary'
    })
    
    # Score RFM (1-5 scale)
    try:
        rfm['R_Score'] = pd.qcut(rfm['Recency'], 5, labels=[5, 4, 3, 2, 1])
        rfm['F_Score'] = pd.qcut(rfm['Frequency'].rank(method='first'), 5, labels=[1, 2, 3, 4, 5])
        rfm['M_Score'] = pd.qcut(rfm['Monetary'], 5, labels=[1, 2, 3, 4, 5])
    except Exception:
        # Fallback for small datasets
        return {
            'available': True,
            'segmentCounts': {},
            'topCustomers': []
        }
    
    rfm['RFM_Score'] = rfm['R_Score'].astype(str) + rfm['F_Score'].astype(str) + rfm['M_Score'].astype(str)
    
    # Define Segments
    def segment_customer(row):
        r, f, m = int(row['R_Score']), int(row['F_Score']), int(row['M_Score'])
        if r >= 5 and f >= 5 and m >= 5: return 'Champions'
        if r >= 3 and f >= 4 and m >= 4: return 'Loyal Customers'
        if r >= 4 and f <= 2: return 'New Customers'
        if r <= 2 and f >= 4: return 'At Risk'
        if r <= 2 and f <= 2: return 'Lost'
        return 'Regular'
    
    rfm['Segment'] = rfm.apply(segment_customer, axis=1)
    
    # Get Segment Counts
    segment_counts = rfm['Segment'].value_counts().to_dict()
    
    # Get Top Customers with Offers
    top_customers = rfm.sort_values('Monetary', ascending=False).head(5).reset_index()
    
    def get_offer(segment):
        offers = {
            'Champions': 'VIP Access + 20% Off',
            'Loyal Customers': 'Double Points',
            'New Customers': 'Welcome Gift',
            'At Risk': 'We Miss You - 10% Off',
            'Lost': 'Win Back - 15% Off',
            'Regular': 'Free Shipping'
        }
        return offers.get(segment, 'Standard Offer')
    
    customers_list = []
    for _, row in top_customers.iterrows():
        customers_list.append({
            'id': str(row['CustomerID']),
            'amount': round(row['Monetary'], 2),
            'segment': row['Segment'],
            'offer': get_offer(row['Segment'])
        })
        
    return {
        'available': True,
        'segmentCounts': segment_counts,
        'topCustomers': customers_list
    }

# ==========================================
# 🚀 API ENDPOINTS
# ==========================================

@app.route('/api/upload-csv', methods=['POST'])
def upload_csv():
    global CURRENT_CSV_FILE, data_cache, CURRENT_MAPPING
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    # FIXED SEC-002: Validate file extension
    if not allowed_file(file.filename):
        return jsonify({'error': 'Only CSV files are allowed'}), 400
    
    # FIXED SEC-003: Sanitize filename to prevent path traversal
    safe_filename_str = secure_filename(file.filename)
    if not safe_filename_str:
        return jsonify({'error': 'Invalid filename'}), 400
    
    # FIXED SEC-002: Check file size
    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)
    if file_size > MAX_FILE_SIZE:
        return jsonify({
            'error': f'File too large. Maximum size: {MAX_FILE_SIZE/1024/1024:.0f}MB'
        }), 413
    
    # Use UUID to avoid filename conflicts
    storage_filename = f"{uuid.uuid4().hex}_{safe_filename_str}"
    filepath = os.path.join(UPLOAD_FOLDER, storage_filename)
    
    # FIXED SEC-003: Ensure path is within UPLOAD_FOLDER
    abs_upload = os.path.abspath(UPLOAD_FOLDER)
    abs_filepath = os.path.abspath(filepath)
    if not abs_filepath.startswith(abs_upload):
        return jsonify({'error': 'Invalid file path'}), 400
    
    try:
        # Validate and load CSV
        df = validate_uploaded_csv(file, filepath)
        
        # 🔍 AUTO-DETECT FIELDS
        detection = detect_fields(df)
        
        mapping = detection['mapping']
        confidence = detection['confidence']
        warnings = detection['warnings']
        
        # Check if required fields were detected
        missing_required = []
        if not mapping.get('date'):
            missing_required.append('date')
        if not mapping.get('value'):
            missing_required.append('value')
        
        # Update global state with storage filename
        CURRENT_CSV_FILE = storage_filename
            data_cache.clear()
            
            # If high confidence and all required fields found → auto-apply mapping
            if confidence == 'high' and not missing_required:
                CURRENT_MAPPING = mapping
                
                # Clean and validate data
                df_clean, clean_warnings = validate_and_clean_data(df, mapping)
                warnings.extend(clean_warnings)
                
                return jsonify({
                    'success': True,
                    'message': 'File uploaded and fields auto-detected!',
                    'filename': filename,
                    'mapping': mapping,
                    'confidence': confidence,
                    'warnings': warnings,
                    'requires_mapping': False,  # ✅ No manual mapping needed!
                    'auto_detected': True
                })
            
            # If medium/low confidence OR missing required → ask user to confirm/edit
            else:
                CURRENT_MAPPING = {}  # Don't auto-apply yet
                
                return jsonify({
                    'success': True,
                    'message': 'Please confirm or adjust field mapping',
                    'filename': filename,
                    'columns': df.columns.tolist(),
                    'suggested_mapping': mapping,
                    'confidence': confidence,
                    'confidence_scores': detection['confidence_scores'],
                    'warnings': warnings,
                    'missing_required': missing_required,
                    'requires_mapping': True,  # ⚠️ User confirmation needed
                    'auto_detected': False
                })
            
        except CSVValidationError as e:
            if os.path.exists(filepath):
                os.remove(filepath)
            return jsonify({'error': str(e)}), 400
        except Exception as e:
            import traceback
            traceback.print_exc()
            return jsonify({'error': f'Invalid CSV: {str(e)}'}), 400
            
    return jsonify({'error': 'Invalid file type'}), 400

@app.route('/api/save-mapping', methods=['POST'])
def save_mapping():
    global CURRENT_MAPPING, data_cache
    
    try:
        mapping = request.json
        if not mapping or 'date' not in mapping or 'value' not in mapping:
            return jsonify({'success': False, 'error': 'Invalid mapping. Date and Value are required.'}), 400
            
        CURRENT_MAPPING = mapping
        data_cache.clear() # Clear cache to force reload with new mapping
        
        print(f"✅ Saved mapping: {CURRENT_MAPPING}")
        return jsonify({'success': True, 'message': 'Mapping saved successfully'})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/dashboard', methods=['GET'])
def get_dashboard():
    try:
        df = load_data()
        if df is None: 
            return jsonify({
                'success': False, 
                'error': 'No data available. Please upload a CSV file to get started.'
            }), 400
        
        # ==========================================
        # 🔥 CRITICAL FIX: Filter BEFORE analytics
        # ==========================================
        # Get date range from query parameters
        from_date = request.args.get('from')
        to_date = request.args.get('to')
        
        # Apply date filter BEFORE any analytics
        df_filtered = df.copy()
        if from_date or to_date:
            if from_date:
                from_dt = pd.to_datetime(from_date)
                df_filtered = df_filtered[df_filtered['InvoiceDate'] >= from_dt]
            if to_date:
                to_dt = pd.to_datetime(to_date)
                df_filtered = df_filtered[df_filtered['InvoiceDate'] <= to_dt]
                
            if df_filtered.empty:
                 return jsonify({'success': False, 'error': 'No data available for selected date range'}), 400

        # Get forecast horizon from query parameters (default: 4 weeks)
        horizon = request.args.get('forecast_horizon', default=4, type=int)
        
        # Validate horizon
        if horizon not in [2, 4, 8, 12]:
            horizon = 4  # Fallback to default
        
        # Check if filtered dataset is too small for forecasting
        date_span = (df_filtered['InvoiceDate'].max() - df_filtered['InvoiceDate'].min()).days
        min_required_days = horizon * 7  # Need at least horizon weeks of data
        
        if date_span < min_required_days:
            # Too small for reliable forecast with this horizon
            return jsonify({
                'success': False, 
                'error': f'Insufficient data for {horizon}-week forecast. Need at least {min_required_days} days, got {date_span} days.'
            }), 400

        # 1. Generate Forecast (with enhanced logging)
        print(f"\n{'='*80}")
        print(f"🚀 Generating forecast for {len(df_filtered)} transactions")
        print(f"   Date range: {df_filtered['InvoiceDate'].min()} to {df_filtered['InvoiceDate'].max()}")
        print(f"   Horizon: {horizon} weeks")
        print(f"{'='*80}\n")
        
        forecast = generate_ml_forecast(df_filtered, horizon=horizon)
        
        # 2. Calculate RFM (on filtered data)
        has_customer_dimension = 'CustomerID' in df_filtered.columns and bool(CURRENT_MAPPING.get('customer')) and CURRENT_MAPPING.get('customer') != 'none'
        rfm = calculate_rfm(df_filtered, has_customer_dimension=has_customer_dimension)
        
        # 3. Get Top Stats (on filtered data)
        countries, products = get_top_stats(df_filtered)
        
        # 4. Log to SUI Blockchain and generate hash
        print(f"\n{'='*80}")
        print(f"⛓️  Logging forecast to SUI Testnet...")
        print(f"{'='*80}\n")
        
        blockchain_result = log_forecast_to_sui(forecast, forecast['totalForecast'])
        forecast_hash = blockchain_result['hash']
        tx_hash = blockchain_result.get('tx_hash', 'Unavailable')
        
        if blockchain_result['success']:
            print(f"✅ Forecast logged to blockchain successfully")
            print(f"   Hash: {forecast_hash[:16]}...")
            print(f"   TX: {tx_hash[:16]}...")
        else:
            print(f"⚠️  Blockchain logging failed: {blockchain_result['message']}")
            print(f"   Hash stored locally: {forecast_hash[:16]}...")
        
        # 5. Root Cause Analysis (on filtered data)
        root_cause = analyze_root_cause_dynamic(df_filtered, CURRENT_MAPPING)
        
        # 6. Available Years (from FULL dataset, not filtered)
        date_col = CURRENT_MAPPING.get('date', 'InvoiceDate')
        if date_col in df.columns:
            years = sorted(df[date_col].dt.year.unique().tolist(), reverse=True)
        else:
            years = []

        metric_label = _format_metric_label(CURRENT_MAPPING.get('value'))

        capabilities = {
            'hasProducts': 'Description' in df_filtered.columns,
            'hasRegions': 'Country' in df_filtered.columns,
            'hasCustomers': has_customer_dimension
        }

        # ==========================================
        # 🆕 PHASE 1: Calculate KPIs
        # ==========================================
        value_col = CURRENT_MAPPING.get('value', 'Quantity')
        date_col = CURRENT_MAPPING.get('date', 'InvoiceDate')
        
        # Total value in current date range
        total_value = df_filtered[value_col].sum()
        
        # Growth % vs previous equal period
        if from_date and to_date:
            # Calculate period length
            period_days = (pd.to_datetime(to_date) - pd.to_datetime(from_date)).days
            
            # Get previous period
            prev_from = pd.to_datetime(from_date) - timedelta(days=period_days)
            prev_to = pd.to_datetime(from_date)
            
            df_previous = df[(df[date_col] >= prev_from) & (df[date_col] < prev_to)]
            prev_value = df_previous[value_col].sum()
            
            if prev_value > 0:
                growth_percent = ((total_value - prev_value) / prev_value) * 100
            else:
                growth_percent = 0
        else:
            # No date range selected, can't calculate growth
            growth_percent = 0
        
        # Average per week
        weeks_in_range = len(df_filtered[date_col].dt.to_period('W').unique())
        avg_per_week = total_value / weeks_in_range if weeks_in_range > 0 else 0
        
        # Transaction count
        transaction_count = len(df_filtered)
        
        kpi_data = {
            'total_value': round(total_value, 2),
            'growth_percent': round(growth_percent, 2),
            'avg_per_week': round(avg_per_week, 2),
            'transaction_count': transaction_count
        }

        # Format date range for display
        date_range_display = None
        if from_date and to_date:
            date_range_display = {
                'from': from_date,
                'to': to_date
            }

        print(f"\n{'='*80}")
        print(f"✅ Dashboard data ready")
        print(f"   Forecast: {forecast['totalForecast']:.2f} {metric_label}")
        print(f"   Confidence: {forecast['accuracy']['confidence']}")
        print(f"   Hash: {forecast_hash[:16]}...")
        print(f"   TX Hash: {tx_hash[:16] if tx_hash != 'Unavailable' else 'Unavailable'}...")
        print(f"{'='*80}\n")
        
        return jsonify({
            'success': True,
            'data': {
                'forecast': forecast,
                'rfm': rfm,
                'countries': countries,
                'products': products,
                'hash': forecast_hash,
                'tx_hash': tx_hash,  # Include TX hash from SUI
                'root_cause': root_cause,
                'years': years,
                'detected_mapping': CURRENT_MAPPING,  # ← Expose mapping for UI debugging
                'metric_label': metric_label,
                'capabilities': capabilities,
                # Phase 1 additions
                'kpi': kpi_data,
                'column_mapping': CURRENT_MAPPING,
                'date_range': date_range_display,
                'dataset_name': CURRENT_CSV_FILE or 'No dataset'
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
            
        forecast_hash = data.get('hash')
        total_sales = int(float(data.get('total_sales', 0)))
        
        if not forecast_hash:
            return jsonify({'success': False, 'error': 'Hash is required'}), 400
            
        # Connect to Ganache
        w3 = Web3(Web3.HTTPProvider(GANACHE_URL))
        if not w3.is_connected():
            return jsonify({'success': False, 'error': 'Blockchain not connected'}), 503
            
        # Get Contract
        address = None
        if os.path.exists(CONTRACT_ADDRESS_FILE):
            with open(CONTRACT_ADDRESS_FILE, 'r') as f:
                address = f.read().strip()
        else:
            address = deploy_contract()
            
        if not address: return None
        
        # Compile to get ABI dynamically
        try:
            with open('ForecastLogger.sol', 'r') as f: source = f.read()
            import solcx
            compiled = solcx.compile_source(source, output_values=['abi'])
            contract_interface = list(compiled.items())[0][1]
            abi = contract_interface['abi']
        except:
            # Fallback ABI if compilation fails at runtime
            abi = [{"inputs":[{"internalType":"string","name":"_forecastHash","type":"string"},{"internalType":"uint256","name":"_totalSales","type":"uint256"}],"name":"logForecast","outputs":[],"stateMutability":"nonpayable","type":"function"}]
        
        contract = w3.eth.contract(address=address, abi=abi)
        
        # Send Transaction
        tx_hash = contract.functions.logForecast(forecast_hash, total_sales).transact({
            'from': w3.eth.accounts[0]
        })
        
        return jsonify({
            'success': True, 
            'tx_hash': w3.to_hex(tx_hash),
            'message': 'Logged to blockchain'
        })
        
    except Exception as e:
        print(f"Blockchain Error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/reconcile', methods=['GET'])
def reconcile_data():
    """
    Reconciliation endpoint: Recompute totals from raw data and compare
    """
    try:
        df = load_data()
        if df is None:
            return jsonify({'success': False, 'error': 'No data available'}), 400
        
        # Get date range filter
        from_date = request.args.get('from')
        to_date = request.args.get('to')
        
        # Apply same filter as dashboard
        df_filtered = df.copy()
        if from_date or to_date:
            date_col = CURRENT_MAPPING.get('date', 'InvoiceDate')
            if from_date:
                from_dt = pd.to_datetime(from_date)
                df_filtered = df_filtered[df_filtered[date_col] >= from_dt]
            if to_date:
                to_dt = pd.to_datetime(to_date)
                df_filtered = df_filtered[df_filtered[date_col] <= to_dt]
        
        # Recompute total from raw data
        value_col = CURRENT_MAPPING.get('value', 'Quantity')
        actual_total = float(df_filtered[value_col].sum())
        
        # Get displayed total from request (optional, for comparison)
        displayed_total = request.args.get('displayed_total', type=float)
        
        if displayed_total is not None:
            difference = actual_total - displayed_total
            match = abs(difference) < 0.01  # Allow small floating point errors
        else:
            difference = 0
            match = True
        
        return jsonify({
            'success': True,
            'actual_total': round(actual_total, 2),
            'match': match,
            'difference': round(difference, 2)
        })
        
    except Exception as e:
        print(f"Reconciliation Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/reset-file', methods=['POST'])
def reset_file():
    """Clear cache (used on page load)"""
    global data_cache
    # Don't reset CURRENT_CSV_FILE - keep whatever user uploaded
    data_cache.clear()
    return jsonify({'success': True, 'message': 'Cache cleared'})
        

@app.route('/api/current-file', methods=['GET'])
def get_current_file():
    """Get currently active CSV filename"""
    return jsonify({
        'success': True,
        'filename': CURRENT_CSV_FILE or 'No file uploaded',
        'is_default': CURRENT_CSV_FILE == DEFAULT_CSV if CURRENT_CSV_FILE else False
    })

@app.route('/api/remove-upload', methods=['POST'])
def remove_upload():
    global CURRENT_CSV_FILE, CURRENT_MAPPING
    try:
        data = request.json
        filename = data.get('filename')
        
        if not filename:
             return jsonify({'success': False, 'error': 'Filename required'}), 400
             
        # Reset to None (No default file)
        CURRENT_CSV_FILE = None
        CURRENT_MAPPING = {}
        data_cache.clear()
        
        return jsonify({'success': True, 'message': 'File removed'})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

def deploy_contract():
    try:
        w3 = Web3(Web3.HTTPProvider(GANACHE_URL))
        if not w3.is_connected(): return None
        
        # Compile
        with open('ForecastLogger.sol', 'r') as f: source = f.read()
        import solcx
        
        # Install solc if needed
        try:
            solcx.get_solc_version()
        except:
            solcx.install_solc('0.8.0')
            
        compiled = solcx.compile_source(source, output_values=['abi', 'bin'])
        contract_interface = list(compiled.items())[0][1]
        
        # Deploy
        ForecastLogger = w3.eth.contract(abi=contract_interface['abi'], bytecode=contract_interface['bin'])
        tx_hash = ForecastLogger.constructor().transact({'from': w3.eth.accounts[0]})
        tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        
        # Save Address
        with open(CONTRACT_ADDRESS_FILE, 'w') as f:
            f.write(tx_receipt.contractAddress)
            
        return tx_receipt.contractAddress
    except Exception as e:
        print(f"Deploy Error: {e}")
        return None

if __name__ == '__main__':
    # Don't load data on startup - wait for user to upload CSV
    # Only deploy if address file doesn't exist
    if not os.path.exists(CONTRACT_ADDRESS_FILE):
        deploy_contract()
    app.run(debug=True, port=5000)
