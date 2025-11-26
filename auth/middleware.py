"""
Auth middleware for Production V1
"""
from functools import wraps
from flask import request, jsonify, g
from auth.jwt_handler import decode_token
from database.models import User
from database.connection import db_session

def require_auth(f):
    """
    Decorator to protect routes - requires valid JWT
    
    Usage:
        @app.route('/api/dashboard')
        @require_auth
        def dashboard():
            user_id = g.user_id
            wallet = g.wallet_address
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Extract token from Authorization header
        auth_header = request.headers.get('Authorization', '')
        
        if not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Missing authentication token'}), 401
        
        token = auth_header.replace('Bearer ', '', 1)
        
        # Validate token
        payload = decode_token(token)
        if not payload:
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        # Load user from database
        user = db_session.query(User).filter(
            User.id == payload['user_id'],
            User.is_active == True
        ).first()
        
        if not user:
            return jsonify({'error': 'User not found or inactive'}), 401
        
        # Inject user context into request
        g.user = user
        g.user_id = user.id
        g.wallet_address = user.wallet_address
        
        return f(*args, **kwargs)
    
    return decorated_function
