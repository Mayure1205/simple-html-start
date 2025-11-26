"""
Database initialization script for Production V1
Run this once to set up the database
"""
import os
from database.connection import engine, Base, init_db
from database.models import User, AuthNonce, Upload, Forecast, AuditLog

def main():
    print("🔧 Initializing database...")
    
    # Check if DATABASE_URL is set
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        print("❌ ERROR: DATABASE_URL not set in environment")
        print("   Please create .env file with DATABASE_URL")
        return
    
    print(f"📊 Connecting to: {db_url.split('@')[1] if '@' in db_url else 'database'}")
    
    try:
        # Create all tables
        init_db()
        print("✅ Database initialized successfully!")
        print("\nTables created:")
        print("  - users")
        print("  - auth_nonces")
        print("  - uploads")
        print("  - forecasts")
        print("  - audit_logs")
        
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
