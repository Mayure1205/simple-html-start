import os
import pandas as pd
import numpy as np
from flask import Flask, jsonify, request, g
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from werkzeug.utils import secure_filename
import hashlib
import json
from datetime import datetime, timedelta
import time
import uuid

# Custom modules
from csv_validator import validate_uploaded_csv
from exceptions import CSVValidationError
from field_detector import detect_fields, validate_and_clean_data

# Enhanced ML forecasting module
from ml.forecast import generate_ml_forecast

# SUI Blockchain adapter
from suiblockchain import log_forecast_to_sui

# ==========================================
# 🔐 AUTH & DATABASE (PRODUCTION V1)
# ==========================================
from auth.routes import auth_bp
from auth.middleware import require_auth
from database.connection import db_session
from database.models import User, Upload, Forecast, AuditLog

app = Flask(__name__)

# ==========================================
# 🔧 CONFIGURATION
# ==========================================
# CORS - Restrict to specific origins
ALLOWED_ORIGINS = os.getenv('ALLOWED_ORIGINS', 'http://localhost:3000,http://localhost:5173').split(',')
CORS(app, resources={r"/*": {"origins": ALLOWED_ORIGINS}})

# Blockchain
GANACHE_URL = os.getenv('BLOCKCHAIN_URL', "http://127.0.0.1:8545")
CONTRACT_ADDRESS_FILE = "contract_address.txt"

# File Upload Configuration
UPLOAD_FOLDER = 'uploads'
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB limit
ALLOWED_EXTENSIONS = {'csv', 'txt'}

# Create uploads folder structure
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ==========================================
# 🚦 RATE LIMITING
# ==========================================
def get_rate_limit_key():
    """Get rate limit key - use user_id if authenticated, else IP"""
    if hasattr(g, 'user_id'):
        return f"user_{g.user_id}"
    return get_remote_address()

limiter = Limiter(
    app=app,
    key_func=get_rate_limit_key,
    default_limits=["100 per minute"],
    storage_uri="memory://"  # For production, use Redis
)

# ==========================================
# 🔐 REGISTER AUTH ROUTES
# ==========================================
app.register_blueprint(auth_bp)

# ==========================================
# 🛠 HELPER FUNCTIONS
# ==========================================

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def _format_metric_label(column_name):
    """Convert raw column name to a human-friendly label"""
    if not column_name:
        return "Metric"
    label = column_name.replace("_", " ").replace("-", " ").strip()
    return label.title() if label else "Metric"


def get_user_latest_upload(user_id):
    """Get the most recent upload for a user"""
    upload = db_session.query(Upload).filter(
        Upload.user_id == user_id
    ).order_by(Upload.created_at.desc()).first()
    return upload


def load_user_data(user_id):
    """
    Load CSV data for a specific user (replaces global load_data)
    Returns: (DataFrame, Upload object) or (None, None)
    """
    upload = get_user_latest_upload(user_id)
    
    if not upload:
        print(f"❌ No upload found for user {user_id}")
        return None, None
    
    try:
        # Load CSV from storage path
        df = pd.read_csv(upload.storage_path, encoding='ISO-8859-1')
        
        # Apply column mapping if exists
        if upload.column_mapping:
            mapping = upload.column_mapping
            rename_map = {
                mapping['date']: 'InvoiceDate',
                mapping['value']: 'TotalAmount'
            }
            
            # Optional columns
            if mapping.get('product') and mapping['product'] != 'none':
                rename_map[mapping['product']] = 'Description'
            if mapping.get('region') and mapping['region'] != 'none':
                rename_map[mapping['region']] = 'Country'
            if mapping.get('customer') and mapping['customer'] != 'none':
                rename_map[mapping['customer']] = 'CustomerID'
            
            df = df.rename(columns=rename_map)
        
        # Ensure InvoiceNo exists
        if 'InvoiceNo' not in df.columns:
            df['InvoiceNo'] = df.index.astype(str)
        
        # Clean data
        df['TotalAmount'] = pd.to_numeric(df['TotalAmount'], errors='coerce').fillna(0)
        df['InvoiceDate'] = pd.to_datetime(df['InvoiceDate'], errors='coerce')
        df = df.dropna(subset=['InvoiceDate'])
        
        if df.empty:
            print("❌ No valid data after cleaning")
            return None, None
        
        print(f"✅ Loaded {len(df)} rows for user {user_id}")
        return df, upload
        
    except Exception as e:
        print(f"❌ Error loading data: {e}")
        import traceback
        traceback.print_exc()
        return None, None


# ==========================================
# 🚀 API ENDPOINTS
# ==========================================

@app.route('/api/upload-csv', methods=['POST'])
@require_auth
@limiter.limit("10 per minute")
def upload_csv():
    """
    Upload CSV file (per-user, stored in DB)
    """
    user_id = g.user_id
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    # Validate file extension
    if not allowed_file(file.filename):
        return jsonify({'error': 'Only CSV files are allowed'}), 400
    
    # Sanitize filename
    safe_filename_str = secure_filename(file.filename)
    if not safe_filename_str:
        return jsonify({'error': 'Invalid filename'}), 400
    
    # Check file size
    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)
    if file_size > MAX_FILE_SIZE:
        return jsonify({
            'error': f'File too large. Maximum size: {MAX_FILE_SIZE/1024/1024:.0f}MB'
        }), 413
    
    try:
        # Create user-specific upload directory
        user_upload_dir = os.path.join(UPLOAD_FOLDER, str(user_id))
        os.makedirs(user_upload_dir, exist_ok=True)
        
        # Generate unique filename
        upload_id = uuid.uuid4()
        storage_filename = f"{upload_id}_{safe_filename_str}"
        storage_path = os.path.join(user_upload_dir, storage_filename)
        
        # Save file
        file.save(storage_path)
        
        # Validate and detect fields
        df = pd.read_csv(storage_path, encoding='ISO-8859-1')
        detection = detect_fields(df)
        
        mapping = detection['mapping']
        confidence = detection['confidence']
        warnings = detection['warnings']
        
        # Check required fields
        missing_required = []
        if not mapping.get('date'):
            missing_required.append('date')
        if not mapping.get('value'):
            missing_required.append('value')
        
        # Create Upload record in DB
        upload = Upload(
            id=upload_id,
            user_id=user_id,
            original_filename=safe_filename_str,
            storage_path=storage_path,
            file_size_bytes=file_size,
            column_mapping=mapping if confidence == 'high' and not missing_required else None,
            row_count=len(df)
        )
        db_session.add(upload)
        db_session.commit()
        
        # Log action
        AuditLog.log(
            user_id=user_id,
            action='UPLOAD',
            metadata={
                'upload_id': str(upload_id),
                'filename': safe_filename_str,
                'size_bytes': file_size,
                'row_count': len(df)
            },
            ip_address=request.remote_addr
        )
        
        # Auto-apply mapping if high confidence
        if confidence == 'high' and not missing_required:
            return jsonify({
                'success': True,
                'message': 'File uploaded and fields auto-detected!',
                'upload_id': str(upload_id),
                'filename': safe_filename_str,
                'mapping': mapping,
                'confidence': confidence,
                'warnings': warnings,
                'requires_mapping': False,
                'auto_detected': True
            })
        else:
            # Need manual mapping
            return jsonify({
                'success': True,
                'message': 'File uploaded. Please confirm field mapping.',
                'upload_id': str(upload_id),
                'filename': safe_filename_str,
                'detected_columns': list(df.columns),
                'suggested_mapping': mapping,
                'confidence': confidence,
                'warnings': warnings,
                'missing_required': missing_required,
                'requires_mapping': True
            })
            
    except Exception as e:
        print(f"❌ Upload error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Upload failed: {str(e)}'}), 500


@app.route('/api/save-mapping', methods=['POST'])
@require_auth
def save_mapping():
    """
    Save column mapping for user's latest upload
    """
    user_id = g.user_id
    data = request.get_json()
    mapping = data.get('mapping')
    
    if not mapping:
        return jsonify({'error': 'Missing mapping'}), 400
    
    # Get latest upload
    upload = get_user_latest_upload(user_id)
    if not upload:
        return jsonify({'error': 'No upload found'}), 404
    
    # Update mapping
    upload.column_mapping = mapping
    db_session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Mapping saved successfully'
    })


@app.route('/api/dashboard')
@require_auth
@limiter.limit("60 per minute")
def dashboard():
    """
    Get dashboard data for authenticated user
    """
    user_id = g.user_id
    
    try:
        # Load user's data
        df, upload = load_user_data(user_id)
        if df is None:
            return jsonify({'error': 'No data uploaded yet. Please upload a CSV file.'}), 404
        
        # Get parameters
        date_range = request.args.get('date_range')
        forecast_horizon = int(request.args.get('horizon', 4))
        
        # Validate horizon
        if forecast_horizon < 1 or forecast_horizon > 52:
            return jsonify({'error': 'Horizon must be between 1 and 52 weeks'}), 400
        
        # Filter by date range if provided
        df_filtered = df.copy()
        if date_range:
            try:
                range_data = json.loads(date_range)
                start_date = pd.to_datetime(range_data['from'])
                end_date = pd.to_datetime(range_data['to'])
                df_filtered = df_filtered[
                    (df_filtered['InvoiceDate'] >= start_date) &
                    (df_filtered['InvoiceDate'] <= end_date)
                ]
            except:
                pass
        
        # Generate forecast
        forecast_result = generate_ml_forecast(df_filtered, horizon=forecast_horizon)
        
        # Get top stats
        countries_data = []
        products_data = []
        
        if 'Country' in df_filtered.columns:
            countries = df_filtered.groupby('Country')['TotalAmount'].sum().sort_values(ascending=False).head(5)
            countries_data = [{'country': c, 'value': round(s, 2)} for c, s in countries.items()]
        
        if 'Description' in df_filtered.columns:
            products = df_filtered.groupby('Description')['TotalAmount'].sum().sort_values(ascending=False).head(5)
            products_data = [{'product': p, 'value': round(q, 2)} for p, q in products.items()]
        
        # Calculate RFM if customer data exists
        rfm_data = {'available': False}
        if 'CustomerID' in df_filtered.columns:
            try:
                from app import calculate_rfm  # Import from old code if exists
                rfm_data = calculate_rfm(df_filtered, has_customer_dimension=True)
            except:
                pass
        
        # Log forecast
        AuditLog.log(
            user_id=user_id,
            action='FORECAST_REQUEST',
            metadata={
                'upload_id': str(upload.id),
                'horizon': forecast_horizon,
                'model': forecast_result.get('model_used')
            }
        )
        
        # Build response
        metric_label = _format_metric_label(upload.column_mapping.get('value') if upload.column_mapping else 'TotalAmount')
        
        return jsonify({
            'forecast': forecast_result.get('forecast', []),
            'accuracy': forecast_result.get('accuracy', {}),
            'countries': countries_data,
            'products': products_data,
            'rfm': rfm_data,
            'metricLabel': metric_label,
            'availableYears': list(df['InvoiceDate'].dt.year.unique()),
            'rootCause': forecast_result.get('root_cause'),
            'upload_info': {
                'filename': upload.original_filename,
                'uploaded_at': upload.created_at.isoformat(),
                'row_count': upload.row_count
            }
        })
        
    except Exception as e:
        print(f"❌ Dashboard error: {e}")
        import traceback
        traceback.print_exc()
        
        AuditLog.log(
            user_id=user_id,
            action='FORECAST_FAILED',
            metadata={'error': str(e)}
        )
        
        return jsonify({'error': f'Failed to generate dashboard: {str(e)}'}), 500


@app.route('/api/reset-file', methods=['POST'])
@require_auth
def reset_file():
    """
    Reset user's current upload (delete latest upload)
    """
    user_id = g.user_id
    
    upload = get_user_latest_upload(user_id)
    if upload:
        # Delete file from disk
        try:
            if os.path.exists(upload.storage_path):
                os.remove(upload.storage_path)
        except:
            pass
        
        # Delete from DB
        db_session.delete(upload)
        db_session.commit()
        
        AuditLog.log(
            user_id=user_id,
            action='UPLOAD_DELETED',
            metadata={'upload_id': str(upload.id)}
        )
    
    return jsonify({'success': True, 'message': 'Upload reset successfully'})


@app.route('/health')
def health():
    """Health check endpoint (no auth required)"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.utcnow().isoformat()})


# ==========================================
# 🔧 CLEANUP
# ==========================================

@app.teardown_appcontext
def shutdown_session(exception=None):
    """Clean up database session"""
    db_session.remove()


# ==========================================
# 🚀 RUN
# ==========================================

if __name__ == '__main__':
    # Development mode
    debug_mode = os.getenv('FLASK_ENV', 'development') == 'development'
    app.run(debug=debug_mode, host='0.0.0.0', port=5000)
