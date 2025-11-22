# 🚀 Quick Setup Guide for Hackathon Demo

## ⚡ 5-Minute Setup

### Step 1: Install Dependencies

**Backend:**
```bash
pip install -r requirements.txt
```

**Frontend:**
```bash
npm install
```

### Step 2: Verify CSV File
```bash
# Make sure this file exists in root directory
ls online_retail_II.csv
```

If missing, download from: https://www.kaggle.com/datasets/mashlyn/online-retail-ii-uci

### Step 3: Start Services (3 Terminals)

**Terminal 1 - Ganache:**
```bash
ganache-cli -p 8545
```
✅ Wait for "Listening on 127.0.0.1:8545"

**Terminal 2 - Backend:**
```bash
python app.py
```
✅ Should show "Contract Deployed at: 0x..." and "Running on http://127.0.0.1:5000"

**Terminal 3 - Frontend:**
```bash
npm run dev
```
✅ Should show "Local: http://localhost:5173"

### Step 4: Access Dashboard
1. Open http://localhost:5173
2. Login with any username/password (demo mode)
3. View dashboard with real data

---

## 🔧 Common Issues & Quick Fixes

### ❌ "CSV file not found"
**Fix:** Copy CSV to root directory:
```bash
cp public/data/online_retail_II.csv ./
```

### ❌ "Cannot connect to blockchain"
**Fix:** Start Ganache first (Terminal 1), then restart backend

### ❌ "Port 5000 already in use"
**Fix (Windows):**
```bash
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**Fix (Mac/Linux):**
```bash
lsof -ti:5000 | xargs kill -9
```

### ❌ "ModuleNotFoundError"
**Fix:** Activate virtual environment:
```bash
# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
```

---

## ✅ Pre-Demo Checklist

- [ ] All 3 terminals running (Ganache, Flask, React)
- [ ] CSV file in root directory
- [ ] Backend shows "Contract Deployed"
- [ ] Frontend loads without errors
- [ ] Dashboard shows real data (not mock)
- [ ] Blockchain button works (Ganache running)

---

## 🎯 Demo Flow

1. **Login** - Show authentication
2. **Total Forecast** - Highlight AI-powered metric
3. **Forecast Chart** - Explain ML prediction
4. **RFM Segments** - Show customer segmentation
5. **Top Customers** - Show personalized offers
6. **Export** - Download Excel report
7. **Blockchain** - Log forecast hash, show TX hash

---

**Ready for Demo! 🚀**

