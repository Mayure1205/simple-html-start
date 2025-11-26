# 🚀 QUICK START - Production V1

## ✅ WHAT'S DONE

**12 Backend Files Created:**
- Database schema + models (4 tables)
- Auth system (JWT + wallet signature)
- Rate limiting setup
- Deployment configs

## ⚠️ WHAT YOU MUST DO

### **1. Update `app.py` (30 min)**

Add at top:
```python
from flask_limiter import Limiter
from auth.routes import auth_bp
from auth.middleware import require_auth
from database.models import Upload, AuditLog
from database.connection import db_session
```

Delete globals:
```python
# DELETE THESE:
CURRENT_CSV_FILE = None
CURRENT_MAPPING = {}
data_cache = {}
```

Register auth:
```python
app.register_blueprint(auth_bp)
limiter = Limiter(app=app, key_func=lambda: g.user_id if hasattr(g, 'user_id') else request.remote_addr)
```

Add `@require_auth` to ALL `/api/*` routes:
```python
@app.route('/api/dashboard')
@require_auth  # ← ADD THIS
def dashboard():
    user_id = g.user_id  # ← Use this
    
    # Get user's upload from DB:
    upload = db_session.query(Upload).filter(
        Upload.user_id == user_id
    ).order_by(Upload.created_at.desc()).first()
    
    df = pd.read_csv(upload.storage_path)
    # ... rest of code
```

### **2. Set Up Database (15 min)**

```bash
# Copy environment template
cp .env.example .env

# Option A: Local
createdb ml_analytics
psql ml_analytics < database/init_db.sql

# Option B: Railway (recommended)
# 1. Create PostgreSQL on railway.app
# 2. Copy DATABASE_URL to .env
# 3. Run: python init_db.py
```

### **3. Install Dependencies (5 min)**

```bash
pip install -r requirements-prod.txt
```

### **4. Test Backend (5 min)**

```bash
python app.py

# Test auth:
curl -X POST http://localhost:5000/auth/nonce \
  -H "Content-Type: application/json" \
  -d '{"wallet_address": "0x123..."}'
```

### **5. Create Frontend Files (2 hours)**

Tell me: "create frontend files" and I'll generate:
- LoginPage.tsx
- useWalletAuth.ts
- AuthContext.tsx
- ProtectedRoute.tsx
- Updated api.ts

## 📋 ENVIRONMENT VARIABLES

Create `.env`:
```bash
DATABASE_URL=postgresql://user:pass@host:5432/ml_analytics
JWT_SECRET=your-random-secret-here
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
FLASK_ENV=development
```

## 🎯 DEPLOYMENT

```bash
# Production:
gunicorn -w 4 -b 0.0.0.0:5000 app:app

# Or deploy to Railway:
# 1. Push to GitHub
# 2. Connect Railway to repo
# 3. Add environment variables
# 4. Deploy
```

## ✅ CHECKLIST

- [ ] Update app.py with auth
- [ ] Set up database
- [ ] Install dependencies
- [ ] Create .env file
- [ ] Test auth endpoints
- [ ] Create frontend files
- [ ] Add real signature verification
- [ ] Deploy

## 💡 READY TO SELL WHEN

1. ✅ Users can login with Sui wallet
2. ✅ Each user sees only their data
3. ✅ Rate limiting active
4. ✅ Running on Gunicorn + HTTPS
5. ✅ Real signature verification added

**Timeline**: 1-2 weeks  
**Cost**: $7k-$12k to finish  
**Supports**: 10-50 customers

---

**Need help?** Just ask:
- "create frontend files"
- "show me how to update app.py"
- "help with database setup"
