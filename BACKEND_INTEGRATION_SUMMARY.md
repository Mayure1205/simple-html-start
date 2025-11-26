# ✅ BACKEND INTEGRATION COMPLETE

## 📦 FILES CHANGED/CREATED

### **✅ MODIFIED:**
1. `auth/routes.py` - Added `/auth/dev-login` endpoint (temporary, for testing)
2. `.env.example` - Added `DEV_LOGIN_ENABLED` flag

### **✅ CREATED:**
3. `app_v2.py` - **COMPLETE REWRITE** with:
   - ❌ Removed ALL global state (`CURRENT_CSV_FILE`, `CURRENT_MAPPING`, `data_cache`)
   - ✅ Added auth middleware to all `/api/*` routes
   - ✅ Added rate limiting (Flask-Limiter)
   - ✅ Per-user data isolation (DB-backed)
   - ✅ Audit logging
   - ✅ User-scoped file storage (`uploads/{user_id}/`)

4. `QUICK_START_DEV.md` - Step-by-step guide to run locally

---

## 🎯 WHAT YOU CAN DO NOW

### **1. Run Backend Locally (No Wallet UI Needed)**

```bash
# Setup (15 minutes)
pip install -r requirements-prod.txt
cp .env.example .env
# Edit .env: set DATABASE_URL, JWT_SECRET, DEV_LOGIN_ENABLED=true
python init_db.py

# Run
python app_v2.py
```

### **2. Get JWT Token (Dev Login)**

```bash
curl -X POST http://localhost:5000/auth/dev-login
```

**Response:**
```json
{
  "access_token": "eyJhbGci...",
  "user": {
    "id": "...",
    "wallet_address": "0xDEVDEVUSER",
    "display_name": "Dev User (devuser)"
  }
}
```

### **3. Test All APIs**

```bash
export TOKEN="<your_token>"

# Upload CSV
curl -X POST http://localhost:5000/api/upload-csv \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@data.csv"

# Get Dashboard
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/dashboard?horizon=4"

# Get User Info
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/auth/me
```

---

## 🔧 HOW DEV-LOGIN WORKS

### **Purpose:**
- Temporary endpoint for testing APIs WITHOUT implementing Sui wallet UI
- Allows you to get a JWT token instantly
- Perfect for backend development and API testing

### **How to Enable:**
```bash
# In .env file:
DEV_LOGIN_ENABLED=true
```

### **How to Use:**
```bash
# Get token (no parameters needed)
curl -X POST http://localhost:5000/auth/dev-login

# Or with custom username:
curl -X POST http://localhost:5000/auth/dev-login \
  -H "Content-Type: application/json" \
  -d '{"username": "alice"}'
```

### **What It Does:**
1. Creates a user with wallet address `0xDEVDEVUSER` (or `0xDEVALICE` etc.)
2. Issues a JWT token for that user
3. Returns token + user info
4. Logs action to audit_logs table

### **Security:**
- ⚠️ **NOT SECURE** - Anyone can get a token
- ⚠️ **DEV ONLY** - Must disable in production
- ⚠️ **TEMPORARY** - Will be removed once wallet UI is ready

### **How to Disable:**
```bash
# In .env:
DEV_LOGIN_ENABLED=false

# Or just remove the line (defaults to false)
```

---

## 📊 WHAT CHANGED IN app_v2.py

### **BEFORE (app.py):**
```python
# ❌ Global state (shared by all users)
CURRENT_CSV_FILE = None
CURRENT_MAPPING = {}
data_cache = {}

@app.route('/api/dashboard')
def dashboard():
    df = pd.read_csv(CURRENT_CSV_FILE)  # ❌ Same file for everyone!
```

### **AFTER (app_v2.py):**
```python
# ✅ No globals!

@app.route('/api/dashboard')
@require_auth  # ✅ Requires JWT token
@limiter.limit("60 per minute")  # ✅ Rate limited
def dashboard():
    user_id = g.user_id  # ✅ From JWT token
    
    # ✅ Get THIS user's upload from DB
    upload = db_session.query(Upload).filter(
        Upload.user_id == user_id
    ).order_by(Upload.created_at.desc()).first()
    
    # ✅ Load THIS user's CSV
    df = pd.read_csv(upload.storage_path)
```

### **Key Changes:**

1. **Auth Required:**
   - ALL `/api/*` routes have `@require_auth`
   - Extracts `user_id` from JWT token
   - Rejects requests without valid token

2. **Per-User Data:**
   - Files stored in `uploads/{user_id}/{upload_id}.csv`
   - Each upload has `user_id` in database
   - Queries filtered by `user_id`

3. **Rate Limiting:**
   - 100 requests/minute default
   - 10 requests/minute for `/api/upload-csv`
   - 60 requests/minute for `/api/dashboard`
   - Uses `user_id` as key (or IP if not authenticated)

4. **Audit Logging:**
   - Logs all actions to `audit_logs` table
   - Tracks: user_id, action, timestamp, metadata

---

## 🚀 EXACT COMMANDS TO RUN

### **First Time Setup:**

```bash
# 1. Install dependencies
pip install -r requirements-prod.txt

# 2. Create .env file
cp .env.example .env

# 3. Edit .env (minimum required):
# DATABASE_URL=postgresql://postgres:password@localhost:5432/ml_analytics
# JWT_SECRET=your-random-secret-here
# DEV_LOGIN_ENABLED=true

# 4. Create database
createdb ml_analytics

# 5. Initialize schema
python init_db.py

# 6. Start backend
python app_v2.py
```

### **Testing Flow:**

```bash
# Terminal 1: Backend
python app_v2.py

# Terminal 2: Testing

# Step 1: Get token
curl -X POST http://localhost:5000/auth/dev-login

# Step 2: Save token
export TOKEN="eyJhbGci..."  # paste the access_token from step 1

# Step 3: Test auth
curl -H "Authorization: Bearer $TOKEN" http://localhost:5000/auth/me

# Step 4: Upload CSV
curl -X POST http://localhost:5000/api/upload-csv \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@your_data.csv"

# Step 5: Get dashboard
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/dashboard?horizon=4"
```

---

## ✅ VERIFICATION

**You know it's working when:**

1. ✅ `python init_db.py` creates 5 tables
2. ✅ `python app_v2.py` starts without errors
3. ✅ `/auth/dev-login` returns a JWT token
4. ✅ `/auth/me` with token returns user info
5. ✅ Can upload CSV and get dashboard data
6. ✅ Different tokens see different data (test with 2 users)

---

## 🎯 NEXT STEPS

### **Now (Testing Phase):**
- ✅ Test all API endpoints with Postman/cURL
- ✅ Upload different CSV files
- ✅ Test with multiple users (different dev-login usernames)
- ✅ Verify data isolation (User A can't see User B's data)

### **Later (Wallet UI Phase):**
- Add Sui wallet connection in frontend
- Create LoginPage.tsx component
- Replace dev-login with real wallet auth
- Disable DEV_LOGIN_ENABLED

### **Production:**
- Set `DEV_LOGIN_ENABLED=false`
- Use managed PostgreSQL (Railway/Heroku)
- Deploy with Gunicorn
- Enable HTTPS

---

## 📞 TROUBLESHOOTING

### **"Module not found" errors:**
```bash
pip install -r requirements-prod.txt
pip install -r requirements.txt
```

### **Database connection fails:**
```bash
# Check PostgreSQL is running
pg_ctl status

# Test connection
psql postgresql://postgres:password@localhost:5432/ml_analytics
```

### **Dev login returns 403:**
```bash
# Check .env has:
DEV_LOGIN_ENABLED=true

# Restart backend after changing .env
```

### **Token expired:**
```bash
# Tokens expire after 30 minutes
# Get a new one:
curl -X POST http://localhost:5000/auth/dev-login
```

---

## 🎉 SUCCESS CRITERIA

**YOU'RE READY TO MOVE FORWARD IF:**

- ✅ Backend starts without errors
- ✅ Can get JWT token via dev-login
- ✅ Can upload CSV files
- ✅ Can get dashboard data
- ✅ Each user sees only their own data
- ✅ Rate limiting works (try >100 requests/min)
- ✅ Audit logs are being created

**Timeline:** Should take 15-30 minutes to set up and test

**Next:** Add Sui wallet UI (separate task, later)

---

**Questions?** Check `QUICK_START_DEV.md` for detailed step-by-step guide.
