"""
Simple JWT handling for Production V1
"""
import os
import jwt
from datetime import datetime, timedelta
from typing import Optional, Dict

# Load from environment
JWT_SECRET = os.getenv('JWT_SECRET', 'CHANGE-THIS-IN-PRODUCTION-USE-RANDOM-STRING')
JWT_ALGORITHM = 'HS256'
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def create_access_token(user_id: str, wallet_address: str) -> str:
    """
    Create JWT access token
    
    Args:
        user_id: User UUID
        wallet_address: Sui wallet address
    
    Returns:
        Encoded JWT string
    """
    payload = {
        'user_id': str(user_id),
        'wallet_address': wallet_address,
        'exp': datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
        'iat': datetime.utcnow()
    }
    
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return token


def decode_token(token: str) -> Optional[Dict]:
    """
    Decode and validate JWT token
    
    Returns:
        Decoded payload or None if invalid
    """
    try:
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM]
        )
        return payload
    except jwt.ExpiredSignatureError:
        print("Token expired")
        return None
    except jwt.InvalidTokenError as e:
        print(f"Invalid token: {e}")
        return None
