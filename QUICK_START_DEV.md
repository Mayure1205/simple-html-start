# 🚀 QUICK START - Running Locally (No Wallet UI)

**Goal**: Get the backend running and test APIs with dev-login (no Sui wallet needed yet)

---

## ✅ WHAT'S READY

- ✅ Database schema (4 tables)
- ✅ Auth system with JWT
- ✅ Per-user data isolation
- ✅ Rate limiting
- ✅ **DEV LOGIN** endpoint (temporary, for testing)
- ✅ Updated `app_v2.py` (new version with all integrations)

---

## 📋 STEP-BY-STEP SETUP

### **1. Install Dependencies (5 minutes)**

```bash
# Install production dependencies
pip install -r requirements-prod.txt

# Install existing dependencies
pip install -r requirements.txt
```

### **2. Set Up Database (15 minutes)**

**Option A: Local PostgreSQL (Recommended for Development)**

```bash
# Install PostgreSQL (if not installed)
# Windows: Download from https://www.postgresql.org/download/windows/
# Mac: brew install postgresql
# Linux: sudo apt-get install postgresql

# Create database
createdb ml_analytics

# Run schema
psql ml_analytics < database/init_db.sql

# OR use Python script:
python init_db.py
```

**Option B: Railway (Free Managed PostgreSQL)**

```bash
# 1. Go to https://railway.app
# 2. Create new project → PostgreSQL
# 3. Copy DATABASE_URL from Railway dashboard
# 4. Paste into .env file (see step 3)
# 5. Run: python init_db.py
```

### **3. Configure Environment (2 minutes)**

```bash
# Copy template
cp .env.example .env

# Edit .env file with your values:
```

**Minimal `.env` for local testing:**
```bash
# Database (use your actual connection string)
DATABASE_URL=postgresql://postgres:password@localhost:5432/ml_analytics

# JWT Secret (generate random string)
JWT_SECRET=my-super-secret-key-change-this

# CORS (for local frontend)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Flask
FLASK_ENV=development

# ⚠️ ENABLE DEV LOGIN (for testing without wallet)
DEV_LOGIN_ENABLED=true
```

**Generate secure JWT_SECRET:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### **4. Initialize Database (1 minute)**

```bash
python init_db.py
```

**Expected output:**
```
🔧 Initializing database...
📊 Connecting to: localhost:5432/ml_analytics
✅ Database initialized successfully!

Tables created:
  - users
  - auth_nonces
  - uploads
  - forecasts
  - audit_logs
```

### **5. Start Backend (1 minute)**

**Option A: Development Mode (with auto-reload)**
```bash
# Use the NEW app_v2.py (has all integrations)
python app_v2.py
```

**Option B: Production Mode (with Gunicorn)**
```bash
gunicorn -w 4 -b 0.0.0.0:5000 app_v2:app
```

**Expected output:**
```
 * Running on http://0.0.0.0:5000
 * Debug mode: on
```

---

## 🧪 TESTING THE API

### **Step 1: Get JWT Token (Dev Login)**

```bash
curl -X POST http://localhost:5000/auth/dev-login \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "wallet_address": "0xDEVDEVUSER",
    "display_name": "Dev User (devuser)"
  },
  "warning": "⚠️ This is a DEV-ONLY login..."
}
```

**Copy the `access_token` value!**

### **Step 2: Test Health Check (No Auth Required)**

```bash
curl http://localhost:5000/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-11-26T08:00:00.000Z"
}
```

### **Step 3: Test Protected Endpoint (With Token)**

```bash
# Replace YOUR_TOKEN with the access_token from step 1
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Get current user
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/auth/me
```

**Response:**
```json
{
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "wallet_address": "0xDEVDEVUSER",
    "display_name": "Dev User (devuser)"
  }
}
```

### **Step 4: Upload CSV File**

```bash
curl -X POST http://localhost:5000/api/upload-csv \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@path/to/your/data.csv"
```

**Response:**
```json
{
  "success": true,
  "message": "File uploaded and fields auto-detected!",
  "upload_id": "abc123...",
  "filename": "data.csv",
  "mapping": {
    "date": "InvoiceDate",
    "value": "TotalAmount",
    "product": "Description",
    "region": "Country"
  },
  "confidence": "high",
  "requires_mapping": false
}
```

### **Step 5: Get Dashboard Data**

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/dashboard?horizon=4"
```

**Response:**
```json
{
  "forecast": [...],
  "accuracy": {...},
  "countries": [...],
  "products": [...],
  "metricLabel": "Total Amount",
  "upload_info": {
    "filename": "data.csv",
    "uploaded_at": "2024-11-26T08:00:00",
    "row_count": 5000
  }
}
```

---

## 🔧 TROUBLESHOOTING

### **Problem: Database connection fails**

```
Error: could not connect to server
```

**Solution:**
1. Check PostgreSQL is running: `pg_ctl status`
2. Verify DATABASE_URL in .env is correct
3. Test connection: `psql $DATABASE_URL`

### **Problem: Dev login returns 403**

```
{
  "error": "Dev login is disabled..."
}
```

**Solution:**
- Check `.env` has `DEV_LOGIN_ENABLED=true`
- Restart backend after changing .env

### **Problem: JWT token expired**

```
{
  "error": "Invalid or expired token"
}
```

**Solution:**
- Tokens expire after 30 minutes
- Get a new token: `curl -X POST http://localhost:5000/auth/dev-login`

### **Problem: No data uploaded yet**

```
{
  "error": "No data uploaded yet. Please upload a CSV file."
}
```

**Solution:**
- Upload a CSV first using `/api/upload-csv`
- Make sure you're using the same token (same user)

---

## 📝 USING POSTMAN

### **1. Create Collection**

1. Open Postman
2. Create new collection: "ML Analytics API"
3. Add base URL variable: `{{base_url}}` = `http://localhost:5000`

### **2. Add Dev Login Request**

```
POST {{base_url}}/auth/dev-login
Body: raw JSON
{}
```

**Save response `access_token` to environment variable:**
- Tests tab:
```javascript
pm.environment.set("token", pm.response.json().access_token);
```

### **3. Add Protected Requests**

For all other requests, add header:
```
Authorization: Bearer {{token}}
```

**Example requests:**
- GET `{{base_url}}/auth/me`
- POST `{{base_url}}/api/upload-csv` (with file)
- GET `{{base_url}}/api/dashboard?horizon=4`

---

## ✅ VERIFICATION CHECKLIST

Test these to confirm everything works:

- [ ] Database initialized successfully
- [ ] Backend starts without errors
- [ ] `/health` endpoint returns 200
- [ ] `/auth/dev-login` returns JWT token
- [ ] `/auth/me` with token returns user info
- [ ] Can upload CSV file
- [ ] Can get dashboard data
- [ ] Different users see different data (test with 2 dev logins)

---

## 🎯 NEXT STEPS

**Once this is working:**

1. ✅ Backend is fully functional
2. ✅ Can test all APIs with Postman/cURL
3. ✅ Ready for frontend integration

**Later (separate tasks):**
- Add Sui wallet UI (LoginPage.tsx)
- Replace dev-login with real wallet auth
- Deploy to production
- Disable DEV_LOGIN_ENABLED

---

## 🚨 IMPORTANT NOTES

### **About DEV LOGIN:**

- ⚠️ **TEMPORARY ONLY** - For testing without wallet UI
- ⚠️ **MUST DISABLE IN PRODUCTION** - Set `DEV_LOGIN_ENABLED=false`
- ⚠️ **NOT SECURE** - Anyone can get a token
- ✅ **PERFECT FOR LOCAL TESTING** - No wallet setup needed

### **About app_v2.py:**

- This is the NEW version with all integrations
- Replaces old `app.py` (which still has globals)
- Once tested, rename: `mv app_v2.py app.py`

### **About Database:**

- All data is per-user (isolated by user_id)
- Uploads stored in `uploads/{user_id}/` folders
- Each user has their own forecast history

---

## 📞 QUICK COMMANDS REFERENCE

```bash
# Setup
pip install -r requirements-prod.txt
cp .env.example .env
# Edit .env with your DATABASE_URL
python init_db.py

# Run
python app_v2.py

# Test
curl -X POST http://localhost:5000/auth/dev-login
export TOKEN="<paste_token_here>"
curl -H "Authorization: Bearer $TOKEN" http://localhost:5000/auth/me

# Upload
curl -X POST http://localhost:5000/api/upload-csv \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@data.csv"

# Dashboard
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/dashboard?horizon=4"
```

---

**Ready to test?** Follow the steps above and you'll have a working backend in 15-20 minutes! 🚀
