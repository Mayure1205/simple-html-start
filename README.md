# 🔗 ChainForecast: AI-Powered Sales Forecasting & CRM Dashboard

**REDACT Suraksha 2k25 Hackathon Project**

A full-stack retail analytics platform that combines **AI/ML sales forecasting**, **customer segmentation**, and **blockchain verification** to help businesses make data-driven decisions.

---

## 📋 Table of Contents

1. [Overview](#-overview)
2. [Problems It Solves](#-problems-it-solves)
3. [Features](#-features)
4. [Technology Stack](#-technology-stack)
5. [Installation Guide](#-installation-guide)
6. [How to Run](#-how-to-run)
7. [How It Works](#-how-it-works)
8. [Project Structure](#-project-structure)
9. [API Endpoints](#-api-endpoints)
10. [Troubleshooting](#-troubleshooting)
11. [Demo Guide](#-demo-guide)

---

## 🎯 Overview

**ChainForecast** is a modern retail analytics platform that:

- **Predicts Future Sales** using Machine Learning (Linear Regression)
- **Segments Customers** using RFM Analysis for targeted marketing
- **Verifies Data Integrity** using Blockchain (Ethereum smart contracts)
- **Visualizes Insights** through interactive charts and dashboards
- **Exports Reports** in CSV/Excel formats for business intelligence

**Domain:** Retail Analytics, Sales Forecasting, Customer Relationship Management (CRM)

**Use Case:** Helps retail businesses forecast sales, identify valuable customers, and create targeted marketing campaigns.

---

## 🎯 Problems It Solves

### 1. **Uncertain Sales Planning**
**Problem:** Businesses struggle to predict future sales, leading to:
- Overstocking (wasted inventory)
- Understocking (lost sales)
- Poor resource allocation

**Solution:** AI-powered 4-week sales forecast using Linear Regression that analyzes historical patterns and predicts future trends.

### 2. **Ineffective Customer Targeting**
**Problem:** Treating all customers the same wastes marketing budget:
- No differentiation between high-value and low-value customers
- Generic offers that don't convert
- High customer churn rates

**Solution:** RFM (Recency, Frequency, Monetary) Analysis segments customers into actionable groups (Champions, Loyal, At-Risk) with personalized offers.

### 3. **Data Integrity Concerns**
**Problem:** Forecasts can be manipulated or disputed:
- No proof of original predictions
- Disputes over forecast accuracy
- Lack of audit trail

**Solution:** Blockchain verification stores forecast hash and total sales on Ethereum blockchain (via Ganache) for immutable proof.

### 4. **Lack of Visual Insights**
**Problem:** Raw data is hard to understand:
- Spreadsheets are overwhelming
- No clear trends visible
- Difficult to present to stakeholders

**Solution:** Interactive dashboard with charts, graphs, and visualizations makes data accessible and actionable.

---

## ✨ Features

### ✅ **Core Features**

1. **AI Sales Forecasting**
   - 4-week future sales prediction
   - Historical vs. forecast comparison
   - Confidence intervals (85%-115%)
   - Christmas/holiday boost logic

2. **RFM Customer Segmentation**
   - Automatic customer scoring (Recency, Frequency, Monetary)
   - 6 segments: Champions, Loyal Customers, Potential Loyalists, At Risk, Lost, Standard
   - Top 10 high-value customers identification
   - Personalized offer recommendations

3. **Blockchain Verification**
   - SHA-256 hash generation for data integrity
   - Smart contract deployment (ForecastLogger.sol)
   - Immutable forecast logging on Ethereum
   - Transaction hash tracking

4. **Interactive Dashboard**
   - Real-time data visualization
   - Sales forecast line chart
   - Regional performance (top countries)
   - Product performance analysis
   - RFM segment distribution (donut chart)
   - Customer table with offers

5. **Data Export**
   - CSV export with all data
   - Excel export with multiple sheets
   - Date range filtering support

6. **Secure Authentication**
   - Login with CAPTCHA
   - Session management
   - Protected routes

### 🎁 **Bonus Features**

- Auto-refresh every 60 seconds
- Error handling with user-friendly messages
- Glassmorphism UI design
- Responsive layout (mobile-friendly)
- Dark/Light theme support

---

## 🛠️ Technology Stack

### **Frontend**

| Technology | Version | Why We Use It |
|------------|---------|---------------|
| **React** | 18.3.1 | Modern UI library, component-based architecture, great ecosystem |
| **TypeScript** | 5.8.3 | Type safety, fewer bugs, better IDE support |
| **Vite** | 5.4.19 | Fast build tool, instant HMR (Hot Module Replacement), better than Create React App |
| **Tailwind CSS** | 3.4.17 | Utility-first CSS, rapid UI development, consistent design |
| **Recharts** | 2.15.4 | Beautiful, responsive charts built on D3.js |
| **React Router** | 6.30.1 | Client-side routing, navigation between pages |
| **shadcn/ui** | Latest | Pre-built, accessible UI components |

**Why This Stack?**
- **React + TypeScript:** Industry standard, type-safe, maintainable
- **Vite:** 10x faster than Webpack, better developer experience
- **Tailwind:** Write less CSS, build faster, consistent design
- **Recharts:** Easy to use, customizable, responsive charts

### **Backend**

| Technology | Version | Why We Use It |
|------------|---------|---------------|
| **Flask** | Latest | Lightweight Python web framework, easy to use, perfect for APIs |
| **Python** | 3.9+ | Great for data science, ML libraries, easy syntax |
| **Pandas** | Latest | Data manipulation, CSV processing, time-series analysis |
| **NumPy** | Latest | Numerical computing, array operations, ML support |
| **scikit-learn** | Latest | Machine Learning library, Linear Regression model |
| **Web3.py** | Latest | Ethereum blockchain interaction, smart contract deployment |

**Why This Stack?**
- **Flask:** Simple, flexible, perfect for REST APIs
- **Pandas:** Industry standard for data analysis
- **scikit-learn:** Reliable ML library, easy to use
- **Web3.py:** Official Python library for Ethereum

### **Blockchain**

| Technology | Version | Why We Use It |
|------------|---------|---------------|
| **Solidity** | 0.8.0 | Smart contract language for Ethereum |
| **Ganache** | Latest | Local Ethereum blockchain for testing |
| **py-solc-x** | Latest | Solidity compiler for Python |

**Why Blockchain?**
- **Immutable Proof:** Forecasts can't be tampered with
- **Transparency:** Anyone can verify predictions
- **Audit Trail:** Permanent record of all forecasts

### **Data Processing**

| Technology | Purpose |
|------------|---------|
| **Pandas** | Load CSV, clean data, aggregate by week |
| **NumPy** | Numerical operations, array handling |
| **scikit-learn** | Train Linear Regression model |

---

## 📦 Installation Guide

### **Prerequisites**

Before installing, ensure you have:

1. **Node.js** v18 or higher
   - Download: https://nodejs.org/
   - Check: `node --version`
   - Why: Needed for React frontend and npm packages

2. **Python** 3.9 or higher
   - Download: https://www.python.org/downloads/
   - Check: `python --version`
   - Why: Needed for Flask backend and ML libraries

3. **Git** (optional, for cloning)
   - Download: https://git-scm.com/
   - Why: To clone the repository

4. **Ganache CLI** (for blockchain)
   - Install: `npm install -g ganache`
   - Why: Local Ethereum blockchain for smart contracts

### **Step 1: Clone Repository**

```bash
git clone https://github.com/MayureshTardekar/suraksha-login-portal.git
cd suraksha-login-portal
```

### **Step 2: Install Backend Dependencies**

```bash
# Create virtual environment (recommended to avoid conflicts)
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install Python packages
pip install -r requirements.txt
```

**What gets installed:**
- `flask` - Web framework
- `flask-cors` - CORS support for React
- `pandas` - Data processing
- `numpy` - Numerical computing
- `scikit-learn` - Machine Learning
- `web3` - Blockchain interaction
- `py-solc-x` - Solidity compiler

### **Step 3: Install Frontend Dependencies**

```bash
npm install
```

**What gets installed:**
- React, TypeScript, Vite
- UI components (shadcn/ui)
- Charts (Recharts)
- Routing (React Router)
- And 50+ other dependencies (see `package.json`)

### **Step 4: Download Dataset**

1. Download `online_retail_II.csv` from:
   - **Kaggle:** https://www.kaggle.com/datasets/mashlyn/online-retail-ii-uci
   - Or use the one in `public/data/` or `src/data/` folder

2. Place it in the **root directory** (same folder as `app.py`):
   ```bash
   # Copy from public/data to root
   cp public/data/online_retail_II.csv ./
   
   # Or download and place manually
   ```

**Why this dataset?**
- Real retail transaction data
- Contains: Invoice, Customer ID, Product, Quantity, Price, Date, Country
- Perfect for sales forecasting and customer segmentation

---

## 🚀 How to Run

### **Important: Run in 3 Separate Terminals**

The application requires 3 services running simultaneously:

### **Terminal 1: Start Ganache (Blockchain)**

```bash
ganache-cli -p 8545
```

**Expected Output:**
```
Ganache CLI v6.x.x

Available Accounts
==================
(0) 0x... (100 ETH)
...

Listening on 127.0.0.1:8545
```

**What this does:**
- Creates a local Ethereum blockchain
- Provides 10 test accounts with 100 ETH each
- Enables smart contract deployment

**Keep this terminal open!**

### **Terminal 2: Start Flask Backend**

```bash
# Make sure virtual environment is activated
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux

# Run Flask server
python app.py
```

**Expected Output:**
```
Loading dataset...
✅ Loaded 525461 transactions
✅ Contract Deployed at: 0x1234...
 * Running on http://127.0.0.1:5000
```

**What this does:**
- Loads CSV data into memory
- Deploys smart contract to Ganache
- Starts Flask API server on port 5000
- Provides endpoints: `/api/dashboard`, `/api/log-blockchain`

**Keep this terminal open!**

### **Terminal 3: Start React Frontend**

```bash
npm run dev
```

**Expected Output:**
```
  VITE v5.x.x  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

**What this does:**
- Starts Vite development server
- Compiles React/TypeScript
- Serves frontend on port 5173
- Hot reload enabled (auto-refresh on code changes)

**Keep this terminal open!**

### **Step 4: Access Dashboard**

1. Open browser: http://localhost:5173
2. Login with any username/password (demo mode)
3. View dashboard with real data!

---

## 🔧 How It Works

### **1. Data Loading & Preprocessing**

```python
# app.py - load_data()
```

**Process:**
1. Reads `online_retail_II.csv` file
2. Maps columns dynamically (handles different CSV formats)
3. Cleans data:
   - Removes rows without Customer ID
   - Filters out cancelled orders (InvoiceNo starting with 'C')
   - Calculates TotalAmount = Quantity × Price
   - Converts dates to datetime format
4. Caches data in memory for performance

**Why this matters:**
- Handles messy real-world data
- Ensures data quality for ML model
- Fast subsequent requests (cached)

### **2. Sales Forecasting (ML Model)**

```python
# app.py - generate_ml_forecast()
```

**Algorithm: Linear Regression**

**Why Linear Regression?**
- Simple, interpretable
- Works well for time-series trends
- Fast training and prediction
- No hyperparameter tuning needed
- Good baseline for sales forecasting

**Process:**
1. **Aggregate Data:** Group transactions by week
2. **Create Features:** Week number (1, 2, 3, ...)
3. **Train Model:** Fit LinearRegression on historical weeks
4. **Predict:** Forecast next 4 weeks
5. **Apply Domain Knowledge:** Boost sales by 40% during Christmas (Dec 18-31)
6. **Calculate Confidence:** 85%-115% range

**Mathematical Formula:**
```
Sales = a × WeekNumber + b
Where:
- a = slope (trend)
- b = intercept (baseline)
```

**Example:**
- Week 1: £200,000
- Week 2: £210,000
- Week 3: £220,000
- **Forecast Week 4:** £230,000 (trend continues)

### **3. RFM Customer Segmentation**

```python
# app.py - generate_rfm()
```

**RFM Analysis:**
- **R (Recency):** Days since last purchase (lower = better)
- **F (Frequency):** Number of purchases (higher = better)
- **M (Monetary):** Total money spent (higher = better)

**Process:**
1. Calculate R, F, M for each customer
2. Score each metric (1-4) using quantiles
3. Combine scores: R×100 + F×10 + M
4. Segment customers:
   - **Champions (444):** High R, F, M - VIP customers
   - **Loyal Customers (333+):** Regular buyers
   - **Potential Loyalists (222+):** Growing customers
   - **At Risk (R=2):** Haven't bought recently
   - **Lost (R=1):** Very old customers
   - **Standard:** Everyone else

**Why RFM?**
- Industry standard for customer segmentation
- Actionable insights (who to target)
- No ML training needed (rule-based)
- Easy to understand and explain

**Example:**
- Customer A: Last purchase 5 days ago, 20 orders, £5,000 spent
  - R=4, F=4, M=4 → **Champions** → Offer: 15% VIP Discount

### **4. Blockchain Verification**

```python
# app.py - log_to_blockchain_real()
# ForecastLogger.sol - Smart Contract
```

**Process:**
1. **Generate Hash:** SHA-256 hash of forecast data
2. **Deploy Contract:** ForecastLogger.sol to Ganache (first time only)
3. **Log to Blockchain:** Call `logForecast(hash, totalSales)`
4. **Get TX Hash:** Transaction receipt from blockchain
5. **Display:** Show TX hash in dashboard

**Smart Contract Code:**
```solidity
contract ForecastLogger {
    struct Log {
        string forecastHash;
        uint256 timestamp;
        uint256 totalSales;
    }
    
    function logForecast(string memory _forecastHash, uint256 _totalSales) public {
        logs.push(Log(_forecastHash, block.timestamp, _totalSales));
    }
}
```

**Why Blockchain?**
- **Immutable:** Can't change forecast after logging
- **Transparent:** Anyone can verify on blockchain
- **Audit Trail:** Permanent record with timestamp
- **Trust:** No need to trust a central authority

### **5. Frontend Dashboard**

```typescript
// src/pages/Dashboard.tsx
```

**Process:**
1. **Fetch Data:** Call `/api/dashboard` endpoint
2. **Display Charts:**
   - ForecastLineChart: Historical + predicted sales
   - CountryBarChart: Top countries by sales
   - ProductBarChart: Top products by quantity
   - RFMDonutChart: Customer segment distribution
3. **Show Metrics:**
   - Total 4-week forecast
   - Top customer segment offer
4. **Blockchain Integration:**
   - Display SHA-256 hash
   - Button to log to blockchain
   - Show transaction hash after logging

**Auto-refresh:** Updates every 60 seconds

---

## 📁 Project Structure

```
suraksha-login-portal/
├── src/                          # React Frontend
│   ├── components/               # Reusable UI components
│   │   ├── charts/              # Chart components
│   │   │   ├── ForecastLineChart.tsx    # Sales forecast line chart
│   │   │   ├── CountryBarChart.tsx      # Regional performance
│   │   │   ├── ProductBarChart.tsx      # Product performance
│   │   │   └── RFMDonutChart.tsx        # Customer segments
│   │   ├── CustomerTable.tsx    # Top customers table
│   │   ├── MetricCard.tsx       # Total forecast display
│   │   ├── OfferCard.tsx        # Segment-based offers
│   │   ├── HashCard.tsx         # Blockchain hash display
│   │   ├── ExportButton.tsx     # CSV/Excel export
│   │   └── ui/                  # shadcn/ui components
│   ├── pages/
│   │   ├── Login.tsx            # Authentication page
│   │   ├── Dashboard.tsx        # Main dashboard
│   │   └── NotFound.tsx         # 404 page
│   ├── services/
│   │   └── api.ts               # API calls to backend
│   ├── contexts/
│   │   └── AuthContext.tsx      # Authentication state
│   └── main.tsx                 # React entry point
│
├── app.py                       # Flask Backend (Main API)
├── ForecastLogger.sol           # Solidity Smart Contract
├── online_retail_II.csv         # Dataset (place in root)
├── contract_address.txt         # Deployed contract address (auto-generated)
│
├── requirements.txt             # Python dependencies
├── package.json                 # Node.js dependencies
├── vite.config.ts              # Vite configuration
├── tailwind.config.ts          # Tailwind CSS configuration
└── README.md                    # This file
```

---

## 🔌 API Endpoints

### **GET /api/dashboard**

Returns all dashboard data.

**Response:**
```json
{
  "success": true,
  "data": {
    "forecast": {
      "historical": [...],
      "forecast": [...],
      "totalForecast": 987471.75
    },
    "rfm": {
      "segmentCounts": {...},
      "topCustomers": [...]
    },
    "countries": [...],
    "products": [...],
    "hash": "abc123..."
  }
}
```

### **POST /api/log-blockchain**

Logs forecast to blockchain.

**Request:**
```json
{
  "hash": "abc123...",
  "total_sales": 987471
}
```

**Response:**
```json
{
  "success": true,
  "tx_hash": "0x1234..."
}
```

### **GET /api/stats/security**

Returns mock security data (bonus feature).

---

## 🐛 Troubleshooting

### **❌ "CSV file not found"**

**Problem:** `online_retail_II.csv` missing or wrong location.

**Solution:**
```bash
# Check if file exists
ls online_retail_II.csv

# If missing, copy from public/data/
cp public/data/online_retail_II.csv ./

# Or download from Kaggle:
# https://www.kaggle.com/datasets/mashlyn/online-retail-ii-uci
```

### **❌ "Blockchain connection failed"**

**Problem:** Ganache not running.

**Solution:**
1. Start Ganache in Terminal 1: `ganache-cli -p 8545`
2. Wait for "Listening on 127.0.0.1:8545"
3. Restart Flask backend (Terminal 2)

### **❌ "Port 5000 already in use"**

**Problem:** Another process using port 5000.

**Solution (Windows):**
```bash
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**Solution (macOS/Linux):**
```bash
lsof -ti:5000 | xargs kill -9
```

### **❌ "ModuleNotFoundError: No module named 'sklearn'"**

**Problem:** Virtual environment not activated or packages not installed.

**Solution:**
```bash
# Activate virtual environment
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux

# Reinstall packages
pip install -r requirements.txt
```

### **❌ Frontend shows mock data**

**Problem:** Backend not running or API error.

**Solution:**
1. Check Terminal 2 - Flask should be running
2. Test API: http://localhost:5000/api/dashboard
3. Check browser console (F12) for errors
4. Verify `vite.config.ts` proxy settings

### **❌ "Contract deployment failed"**

**Problem:** Ganache not running or solc not installed.

**Solution:**
1. Start Ganache first
2. `py-solc-x` will auto-install solc compiler
3. Check internet connection (needed for first-time solc download)

---

## 🎬 Demo Guide

### **For Hackathon Judges**

**5-Minute Demo Flow:**

1. **Login (30 sec)**
   - Show login page with CAPTCHA
   - Demonstrate authentication

2. **Dashboard Overview (1 min)**
   - Highlight total 4-week forecast metric
   - Explain: "AI predicted £987,471 in next 4 weeks"

3. **Sales Forecast Chart (1 min)**
   - Show historical vs. forecast line chart
   - Explain: "Blue line = past sales, dotted = AI prediction"
   - Point out confidence intervals

4. **Customer Segmentation (1 min)**
   - Show RFM donut chart
   - Explain: "Champions = VIP customers, At Risk = need attention"
   - Show top customers table with personalized offers

5. **Blockchain Verification (1 min)**
   - Click "Log to Blockchain" button
   - Show transaction hash
   - Explain: "Forecast is now immutable on blockchain"

6. **Export Feature (30 sec)**
   - Export to Excel
   - Show multiple sheets with all data

**Key Points to Emphasize:**
- ✅ Real ML model (not hardcoded)
- ✅ Blockchain verification (immutable proof)
- ✅ Actionable insights (personalized offers)
- ✅ Production-ready (error handling, validation)

---

## 📊 Technologies Used Summary

| Category | Technology | Purpose |
|----------|------------|---------|
| **Frontend Framework** | React 18 + TypeScript | Modern UI development |
| **Build Tool** | Vite | Fast development & building |
| **Styling** | Tailwind CSS | Utility-first CSS framework |
| **Charts** | Recharts | Data visualization |
| **Backend** | Flask (Python) | REST API server |
| **Data Processing** | Pandas + NumPy | CSV processing, calculations |
| **Machine Learning** | scikit-learn | Linear Regression model |
| **Blockchain** | Solidity + Web3.py | Smart contracts & Ethereum |
| **Blockchain Testnet** | Ganache | Local Ethereum blockchain |

---

## 🎓 Why These Technologies?

### **Why Linear Regression (not ARIMA/Prophet)?**

- ✅ **Simple & Fast:** Trains in milliseconds
- ✅ **Interpretable:** Easy to explain to stakeholders
- ✅ **No Hyperparameters:** Works out of the box
- ✅ **Good Baseline:** Perfect for hackathon demo
- ❌ ARIMA: Complex, needs parameter tuning
- ❌ Prophet: Overkill for this dataset, slower

### **Why RFM (not K-Means)?**

- ✅ **Rule-Based:** No training needed
- ✅ **Interpretable:** Clear business meaning
- ✅ **Industry Standard:** Widely used in retail
- ✅ **Actionable:** Direct mapping to marketing strategies
- ❌ K-Means: Requires interpretation, less intuitive

### **Why Blockchain?**

- ✅ **Immutable Proof:** Forecasts can't be tampered
- ✅ **Transparency:** Anyone can verify
- ✅ **Audit Trail:** Permanent record
- ✅ **Bonus Points:** Shows advanced integration

---

## 📝 License

Open-source for **REDACT Suraksha 2k25 Hackathon**. Free to fork, modify, and extend.

---

## 🙏 Acknowledgments

- **Dataset:** UK Online Retail II (UCI Machine Learning Repository)
- **Blockchain:** Ganache (Truffle Suite)
- **UI Components:** shadcn/ui
- **Charts:** Recharts

---

## 👥 Team

**Project:** ChainForecast  
**Hackathon:** REDACT Suraksha 2k25  
**Category:** AI + Blockchain  
**Domain:** Retail Analytics, Sales Forecasting, CRM

---

**Built with ❤️ for REDACT Suraksha 2k25**  
*Happy Hacking! 🚀*

---

## 📞 Support

If you encounter any issues:
1. Check [Troubleshooting](#-troubleshooting) section
2. Verify all 3 terminals are running
3. Check browser console (F12) for errors
4. Ensure CSV file is in root directory

**Common Issues:**
- Ganache not running → Start Terminal 1
- Backend error → Check Terminal 2 logs
- Frontend not loading → Check Terminal 3, clear browser cache
