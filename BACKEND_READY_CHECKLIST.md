# ✅ BACKEND READY CHECKLIST

## 🎯 GOAL
Make the app runnable and testable WITHOUT wallet UI using dev-login.

---

## 📦 WHAT WAS DONE

### ✅ **Files Created:**
1. `app_v2.py` - Complete rewrite with auth + DB integration
2. `auth/routes.py` - Added `/auth/dev-login` endpoint
3. `QUICK_START_DEV.md` - Setup guide
4. `BACKEND_INTEGRATION_SUMMARY.md` - Complete documentation

### ✅ **Key Changes:**
- ❌ Removed ALL global state (CURRENT_CSV_FILE, CURRENT_MAPPING, data_cache)
- ✅ Added `@require_auth` to all `/api/*` routes
- ✅ Added per-user data isolation (DB-backed)
- ✅ Added rate limiting (Flask-Limiter)
- ✅ Added audit logging
- ✅ Added DEV_LOGIN endpoint (temporary, for testing)

---

## 🚀 YOUR ACTION ITEMS

### **1. Install Dependencies** ⏱️ 5 min
```bash
pip install -r requirements-prod.txt
```

### **2. Set Up Database** ⏱️ 15 min

**Option A: Local PostgreSQL**
```bash
createdb ml_analytics
python init_db.py
```

**Option B: Railway (Free)**
```bash
# 1. Create PostgreSQL on railway.app
# 2. Copy DATABASE_URL
# 3. Add to .env
# 4. Run: python init_db.py
```

### **3. Configure .env** ⏱️ 2 min
```bash
cp .env.example .env
# Edit .env with:
# - DATABASE_URL
# - JWT_SECRET (generate with: python -c "import secrets; print(secrets.token_urlsafe(32))")
# - DEV_LOGIN_ENABLED=true
```

### **4. Test Backend** ⏱️ 5 min
```bash
# Start
python app_v2.py

# Get token
curl -X POST http://localhost:5000/auth/dev-login

# Test
export TOKEN="<paste_token>"
curl -H "Authorization: Bearer $TOKEN" http://localhost:5000/auth/me
```

---

## ✅ VERIFICATION CHECKLIST

Test these to confirm everything works:

- [ ] `python init_db.py` creates 5 tables successfully
- [ ] `python app_v2.py` starts without errors
- [ ] `curl http://localhost:5000/health` returns `{"status": "healthy"}`
- [ ] `curl -X POST http://localhost:5000/auth/dev-login` returns JWT token
- [ ] Can call `/auth/me` with token
- [ ] Can upload CSV file
- [ ] Can get dashboard data
- [ ] Different users see different data (test with 2 dev-login calls)

---

## 🧪 TESTING COMMANDS

```bash
# 1. Get token
curl -X POST http://localhost:5000/auth/dev-login

# 2. Save token
export TOKEN="eyJhbGci..."

# 3. Test auth
curl -H "Authorization: Bearer $TOKEN" http://localhost:5000/auth/me

# 4. Upload CSV
curl -X POST http://localhost:5000/api/upload-csv \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@data.csv"

# 5. Get dashboard
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/dashboard?horizon=4"
```

---

## 🎯 SUCCESS CRITERIA

**✅ YOU'RE DONE WHEN:**

1. Backend runs without errors
2. Can get JWT token via `/auth/dev-login`
3. Can upload CSV and get dashboard data
4. Each user sees only their own data
5. All API endpoints work with authentication

**Timeline:** 20-30 minutes total

---

## 📝 NOTES

### **About app_v2.py:**
- This is the NEW version with all integrations
- Replaces old `app.py` (which still has globals)
- Once tested, you can rename it: `mv app_v2.py app.py`

### **About DEV_LOGIN:**
- ⚠️ TEMPORARY - Only for testing without wallet UI
- ⚠️ NOT SECURE - Anyone can get a token
- ⚠️ MUST DISABLE IN PRODUCTION - Set `DEV_LOGIN_ENABLED=false`
- ✅ PERFECT FOR NOW - No wallet setup needed

### **What's NOT Done (Intentionally):**
- ❌ Sui wallet UI (LoginPage.tsx) - Will do later
- ❌ Frontend integration - Will do later
- ❌ Real wallet signature verification - Will do later
- ❌ Production deployment - Will do later

---

## 🔄 NEXT STEPS

### **Phase 1: Backend Testing (NOW)**
- ✅ Set up database
- ✅ Test all APIs with Postman/cURL
- ✅ Verify data isolation
- ✅ Test with multiple users

### **Phase 2: Frontend Integration (LATER)**
- Add Sui wallet connection
- Create LoginPage.tsx
- Update api.ts to use tokens
- Add protected routes

### **Phase 3: Production (LATER)**
- Replace dev-login with real wallet auth
- Disable DEV_LOGIN_ENABLED
- Deploy to Railway/Heroku
- Add monitoring

---

## 📞 HELP

**If something doesn't work:**

1. Check `QUICK_START_DEV.md` for detailed steps
2. Check `BACKEND_INTEGRATION_SUMMARY.md` for explanations
3. Check database connection: `psql $DATABASE_URL`
4. Check .env file has all required variables
5. Check backend logs for errors

**Common Issues:**
- "Module not found" → `pip install -r requirements-prod.txt`
- "Database connection failed" → Check DATABASE_URL in .env
- "Dev login disabled" → Set `DEV_LOGIN_ENABLED=true` in .env
- "Token expired" → Get new token (expires after 30 min)

---

## ✅ FINAL CHECK

**Before moving to next phase, confirm:**

- [ ] Backend runs locally
- [ ] Database is set up
- [ ] Can get JWT tokens
- [ ] Can upload files
- [ ] Can get dashboard data
- [ ] Data is isolated per user
- [ ] Ready for frontend integration

**Status:** Backend is READY for testing! 🎉

**Next:** Test thoroughly, then move to wallet UI integration.
