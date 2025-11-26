"""
Auth endpoints for Production V1
"""
from flask import Blueprint, request, jsonify, g
from datetime import datetime, timedelta
import secrets
from auth.jwt_handler import create_access_token
from auth.middleware import require_auth
from database.models import User, AuthNonce, AuditLog
from database.connection import db_session

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

NONCE_EXPIRY_MINUTES = 5

@auth_bp.route('/nonce', methods=['POST'])
def get_nonce():
    """
    Generate nonce for wallet signature
    
    Request:
        {
            "wallet_address": "0x..."
        }
    
    Response:
        {
            "nonce": "...",
            "message": "Sign in to ML Analytics...",
            "expires_at": "2024-..."
        }
    """
    try:
        data = request.get_json()
        wallet_address = data.get('wallet_address', '').lower()
        
        if not wallet_address or not wallet_address.startswith('0x'):
            return jsonify({'error': 'Invalid wallet address'}), 400
        
        # Clean up old nonces for this wallet
        db_session.query(AuthNonce).filter(
            AuthNonce.wallet_address == wallet_address,
            AuthNonce.expires_at < datetime.utcnow()
        ).delete()
        db_session.commit()
        
        # Generate nonce
        nonce = secrets.token_urlsafe(32)
        expires_at = datetime.utcnow() + timedelta(minutes=NONCE_EXPIRY_MINUTES)
        
        # Create message
        timestamp = datetime.utcnow().isoformat()
        message = f"""Sign in to ML Analytics Platform

Wallet: {wallet_address}
Time: {timestamp}
Nonce: {nonce}

This will not trigger any blockchain transaction."""
        
        # Store in database
        nonce_record = AuthNonce(
            wallet_address=wallet_address,
            nonce=nonce,
            message=message,
            expires_at=expires_at
        )
        db_session.add(nonce_record)
        db_session.commit()
        
        return jsonify({
            'nonce': nonce,
            'message': message,
            'expires_at': expires_at.isoformat()
        })
        
    except Exception as e:
        print(f"Nonce generation error: {e}")
        return jsonify({'error': 'Failed to generate nonce'}), 500


@auth_bp.route('/verify', methods=['POST'])
def verify_signature():
    """
    Verify signature and issue JWT
    
    Request:
        {
            "wallet_address": "0x...",
            "signature": "...",
            "nonce": "..."
        }
    
    Response:
        {
            "access_token": "eyJ...",
            "user": {...}
        }
    """
    try:
        data = request.get_json()
        wallet_address = data.get('wallet_address', '').lower()
        signature = data.get('signature')
        nonce = data.get('nonce')
        
        if not all([wallet_address, signature, nonce]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Validate nonce
        nonce_record = db_session.query(AuthNonce).filter(
            AuthNonce.wallet_address == wallet_address,
            AuthNonce.nonce == nonce,
            AuthNonce.used == False,
            AuthNonce.expires_at > datetime.utcnow()
        ).first()
        
        if not nonce_record:
            return jsonify({'error': 'Invalid or expired nonce'}), 401
        
        # Mark nonce as used
        nonce_record.used = True
        db_session.commit()
        
        # TODO: Verify signature with Sui SDK
        # For V1, we'll accept any signature (MUST FIX with real verification)
        # In production, use @mysten/sui.js to verify signature
        
        # Find or create user
        user = db_session.query(User).filter(
            User.wallet_address == wallet_address
        ).first()
        
        if not user:
            # First-time login: create user
            user = User(
                wallet_address=wallet_address,
                display_name=f"User-{wallet_address[:8]}"
            )
            db_session.add(user)
            db_session.flush()
            
            AuditLog.log(
                user_id=user.id,
                action='USER_CREATED',
                metadata={'wallet_address': wallet_address},
                ip_address=request.remote_addr
            )
        
        # Update last login
        user.last_login_at = datetime.utcnow()
        db_session.commit()
        
        # Generate JWT
        access_token = create_access_token(
            user_id=str(user.id),
            wallet_address=user.wallet_address
        )
        
        # Log successful login
        AuditLog.log(
            user_id=user.id,
            action='LOGIN_SUCCESS',
            metadata={'wallet_address': wallet_address},
            ip_address=request.remote_addr
        )
        
        return jsonify({
            'access_token': access_token,
            'user': {
                'id': str(user.id),
                'wallet_address': user.wallet_address,
                'display_name': user.display_name
            }
        })
        
    except Exception as e:
        print(f"Verify signature error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Authentication failed'}), 500


@auth_bp.route('/me', methods=['GET'])
@require_auth
def get_current_user():
    """
    Get current authenticated user
    """
    return jsonify({
        'user': {
            'id': str(g.user.id),
            'wallet_address': g.user.wallet_address,
            'display_name': g.user.display_name
        }
    })


# ==========================================
# 🔧 DEV LOGIN (FOR TESTING ONLY)
# ==========================================

@auth_bp.route('/dev-login', methods=['POST'])
def dev_login():
    """
    ⚠️ DEV ONLY - Temporary login endpoint for testing without wallet UI
    
    This endpoint allows you to get a JWT token for testing API endpoints
    without implementing the full Sui wallet connection.
    
    IMPORTANT:
    - Only enabled when DEV_LOGIN_ENABLED=true in environment
    - MUST be disabled in production
    - Will be removed once wallet UI is implemented
    
    Request:
        POST /auth/dev-login
        {
            "username": "testuser"  # optional, defaults to "devuser"
        }
    
    Response:
        {
            "access_token": "eyJ...",
            "user": {...}
        }
    
    Usage:
        curl -X POST http://localhost:5000/auth/dev-login
        # Copy the access_token
        # Use it in subsequent requests:
        curl -H "Authorization: Bearer <token>" http://localhost:5000/api/dashboard
    """
    import os
    
    # Check if dev login is enabled
    if os.getenv('DEV_LOGIN_ENABLED', 'false').lower() != 'true':
        return jsonify({
            'error': 'Dev login is disabled. Set DEV_LOGIN_ENABLED=true in .env to enable.'
        }), 403
    
    try:
        data = request.get_json() or {}
        username = data.get('username', 'devuser')
        
        # Create dev wallet address
        dev_wallet = f"0xDEV{username.upper()}"
        
        # Find or create dev user
        user = db_session.query(User).filter(
            User.wallet_address == dev_wallet
        ).first()
        
        if not user:
            user = User(
                wallet_address=dev_wallet,
                display_name=f"Dev User ({username})"
            )
            db_session.add(user)
            db_session.flush()
            
            AuditLog.log(
                user_id=user.id,
                action='DEV_USER_CREATED',
                metadata={'username': username},
                ip_address=request.remote_addr
            )
        
        # Update last login
        user.last_login_at = datetime.utcnow()
        db_session.commit()
        
        # Generate JWT
        access_token = create_access_token(
            user_id=str(user.id),
            wallet_address=user.wallet_address
        )
        
        # Log dev login
        AuditLog.log(
            user_id=user.id,
            action='DEV_LOGIN',
            metadata={'username': username},
            ip_address=request.remote_addr
        )
        
        return jsonify({
            'access_token': access_token,
            'user': {
                'id': str(user.id),
                'wallet_address': user.wallet_address,
                'display_name': user.display_name
            },
            'warning': '⚠️ This is a DEV-ONLY login. Disable DEV_LOGIN_ENABLED in production.'
        })
        
    except Exception as e:
        print(f"Dev login error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Dev login failed'}), 500
