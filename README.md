# REDACT Suraksha 2k25 ChainForecast Dashboard

## 🎯 Overview
A **React + TypeScript + Vite** frontend with **Flask + ML** backend that:
- ✅ **AI Sales Forecasting** – 4-week prediction using Linear Regression (scikit-learn)
- ✅ **RFM Customer Segmentation** – Quantile-based scoring with personalized offers
- ✅ **Blockchain Verification** – Logs forecast hash to Ethereum (Ganache) via Solidity smart contract
- ✅ **Premium Dashboard UI** – Glassmorphism design with interactive charts (Recharts)
- ✅ **Data Export** – CSV/Excel reports with date range filtering
- ✅ **Secure Authentication** – Login with 5-attempt lockout & 30s cooldown

All monetary values displayed in **British Pounds (£)**.

---

## 🚀 Quick Start (Demo-Ready in 5 Minutes)

### **Prerequisites**
- **Node.js** v18+ ([Download](https://nodejs.org/))
- **Python** 3.9+ ([Download](https://www.python.org/downloads/))
- **Ganache CLI** ([Install](https://github.com/trufflesuite/ganache#command-line-use)): `npm install -g ganache`

---

### **⚡ Installation Steps**

#### **1. Clone & Setup**
```bash
git clone https://github.com/MayureshTardekar/suraksha-login-portal.git
cd suraksha-login-portal
```

#### **2. Install Dependencies**

**Backend (Python):**
```bash
# Create virtual environment (recommended)
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install packages
pip install -r requirements.txt
```

**Frontend (Node.js):**
```bash
npm install
```

---

### **🔥 Running the App**

**Open 3 terminals and run in order:**

#### **Terminal 1: Start Ganache (Blockchain)**
```bash
ganache-cli -p 8545
```
✅ **Success:** Should show "Listening on 127.0.0.1:8545"

#### **Terminal 2: Start Flask Backend**
```bash
python app.py
```
✅ **Success:** Should show "Contract Deployed at: 0x..." and "Running on http://127.0.0.1:5000"

⚠️ **If you see errors:**
- **CSV not found:** Make sure `online_retail_II.csv` is in root directory
- **Ganache error:** Start Ganache first (Terminal 1)
- **Port 5000 in use:** Kill process or change port in `app.py`

#### **Terminal 3: Start React Frontend**
```bash
npm run dev
```
✅ **Success:** Should show "Local: http://localhost:5173"

---

### **🎮 Using the Dashboard**

1. **Login:** Open http://localhost:5173
   - Username: `admin`
   - Password: `redact2025`

2. **View Dashboard:**
   - Total 4-week forecast (AI-powered)
   - Historical vs. forecast line chart
   - Top countries & products
   - RFM customer segments
   - Personalized offer suggestions

3. **Export Data:**
   - Click "Export" → Choose CSV or Excel
   - Includes all charts, forecasts, and customer data

4. **Log to Blockchain:**
   - Click "⛓️ Log to Blockchain" button
   - Wait for transaction confirmation
   - TX hash displayed (verify in Ganache)

---

## 🛠️ Troubleshooting

### ❌ **"Data load failed" / App won't start**
**Cause:** CSV file missing or in wrong location

**Fix:**
```bash
# Make sure online_retail_II.csv is in root directory
ls online_retail_II.csv  # Should exist

# If missing, check public/data/ or src/data/ and copy to root:
cp public/data/online_retail_II.csv ./
```

### ❌ **"Cannot connect to blockchain" / Blockchain button fails**
**Cause:** Ganache not running

**Fix:**
```bash
# Terminal 1 - Start Ganache first
ganache-cli -p 8545

# Wait for "Listening on 127.0.0.1:8545"
# Then restart backend (Terminal 2)
```

### ❌ **"Port 5000 already in use"**
**Fix:**
```bash
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux:
lsof -ti:5000 | xargs kill -9
```

### ❌ **"ModuleNotFoundError: No module named 'sklearn'"**
**Fix:**
```bash
# Make sure virtual environment is activated
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows

# Reinstall dependencies
pip install -r requirements.txt
```

### ❌ **Frontend shows mock data instead of real data**
**Cause:** Backend not running or port mismatch

**Fix:**
1. Check Terminal 2 - Flask should show "Running on http://127.0.0.1:5000"
2. Open browser console (F12) - Should NOT see "❌ Error loading API data"
3. Test API directly: http://localhost:5000/api/dashboard
4. If still failing, check `vite.config.ts` proxy settings

---

## 📁 Project Structure
```
├── src/                          # React frontend
│   ├── components/               # UI components
│   │   ├── charts/              # Recharts visualizations
│   │   ├── MetricCard.tsx       # Total forecast display
│   │   ├── OfferCard.tsx        # Segment-based offers
│   │   └── ExportButton.tsx     # CSV/Excel export
│   ├── pages/
│   │   ├── Login.tsx            # Auth with lockout
│   │   └── Dashboard.tsx        # Main dashboard
│   ├── services/api.ts          # Backend API calls
│   └── contexts/AuthContext.tsx # Session management
├── ForecastLogger.sol           # Solidity smart contract
├── app.py                       # Flask API + ML engine
├── online_retail_II.csv         # Dataset (~90 MB)
├── requirements.txt             # Python dependencies
└── package.json                 # Node.js dependencies
```

---

## 🎯 Features Checklist

### ✅ **Core Requirements (Complete)**
- [x] **ML Sales Forecasting** – Linear Regression with 4-week prediction
- [x] **RFM Segmentation** – Quantile-based customer scoring
- [x] **Smart Contract** – ForecastLogger.sol with deployment
- [x] **Blockchain Integration** – Hash logging to Ganache
- [x] **Dashboard UI** – All charts & visualizations
- [x] **Data Export** – CSV/Excel with date filters
- [x] **Authentication** – Login with security features
- [x] **SHA-256 Hash** – Data integrity verification

### 🎁 **Bonus Features**
- [x] **Offer Engine** – Personalized recommendations per segment
- [x] **Error Handling** – User-friendly messages for common issues
- [x] **Glassmorphism UI** – Premium design system
- [x] **Auto-refresh** – Dashboard updates every 60s
- [ ] **Real Auth Backend** – Currently uses mock (hardcoded)
- [ ] **K-Means Clustering** – Alternative to RFM (not implemented)
- [ ] **Date Range Filtering** – UI exists but backend needs update

---

## 🔐 Default Credentials
- **Username:** `admin`
- **Password:** `redact2025`
- **Security:** 5 failed attempts = 30-second lockout

---

## 📊 Tech Stack
- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **Backend:** Flask + Python 3.9+
- **ML:** scikit-learn (Linear Regression)
- **Blockchain:** Web3.py + Solidity + Ganache
- **Charts:** Recharts
- **Data Processing:** Pandas + NumPy

---

## 🎓 Hackathon Notes
**Project:** REDACT Suraksha 2k25 ChainForecast  
**Team:** [Your Team Name]  
**Category:** AI + Blockchain

**What makes this unique:**
1. **Real ML Model** – Not hardcoded forecasts, actual Linear Regression
2. **Blockchain Verification** – Immutable proof of forecasts on Ethereum
3. **Smart Segmentation** – Dynamic RFM with quantile-based scoring
4. **Production-Ready** – Error handling, fallbacks, user-friendly messages

**Demo Flow:**
1. Show login security (lockout feature)
2. Highlight total forecast metric
3. Explain AI forecast vs. historical
4. Show RFM segments & personalized offers
5. Export data to Excel
6. Log forecast to blockchain & show TX hash

---

## 📝 License
Open-source for **REDACT 2k25 Hackathon**. Free to fork, modify, and extend.

---

## 🙏 Acknowledgments
- Dataset: **UK Online Retail II** (UCI Machine Learning Repository)
- Blockchain: **Ganache** (Truffle Suite)
- UI Inspiration: **Glassmorphism Design Trends 2024**

---

**Built with ❤️ for REDACT Suraksha 2k25**  
*Happy Hacking! 🚀*
