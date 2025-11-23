# 📊 ChainForecast – REDACT Suraksha 2k25

**Premium Retail CRM with AI-Powered Forecasting & Blockchain Verification**

ChainForecast is a state-of-the-art dashboard designed for retail analytics. It combines advanced Machine Learning (ARIMA/Linear Regression) for sales forecasting with Blockchain technology (Ganache) to ensure data integrity.
done
---

## 🚀 Features (Khasiyat)

- **📈 AI Sales Forecasting:** Predicts future sales for the next 4 weeks using historical data.
- **⛓️ Blockchain Integrity:** Hashes forecast data and logs it to a local Ethereum blockchain (Ganache) for immutable proof.
- **📊 Interactive Dashboard:** Beautiful, responsive UI with real-time charts (Recharts) and glassmorphism design.
- **📂 CSV Upload Manager:** Upload your own datasets (e.g., `online_retail_II.csv`) and visualize them instantly.
- **📅 Smart Date Filtering:** Auto-detects date ranges from uploaded files.
- **🛡️ Secure Login:** SHA-256 password hashing and strict password strength validation.
- **👥 RFM Analysis:** Segments customers based on Recency, Frequency, and Monetary value.

---

## 🛠️ Tech Stack (Kya use kiya hai)

### **Frontend**
- **React (Vite):** Fast and modern UI framework.
- **Tailwind CSS:** For beautiful, responsive styling.
- **Shadcn/UI:** Premium UI components.
- **Recharts:** For interactive charts and graphs.
- **Lucide React:** For beautiful icons.

### **Backend**
- **Flask (Python):** Lightweight and fast backend server.
- **Pandas:** For powerful data processing and CSV handling.
- **Scikit-learn / Statsmodels:** For ML forecasting (Linear Regression / ARIMA).
- **Web3.py:** For interacting with the Ethereum blockchain (Ganache).

---

## ⚙️ Prerequisites (Pehle ye install karein)

1.  **Node.js** (v16 or higher)
2.  **Python** (v3.8 or higher)
3.  **Ganache** (for local blockchain simulation) - [Download Here](https://trufflesuite.com/ganache/)

---

## 📥 Installation & Setup (Kaise run karein)

### **1. Clone the Repository**
```bash
git clone <repository-url>
cd suraksha-login-portal
```

### **2. Backend Setup (Python)**
Open a terminal in the project root:

```bash
# Install dependencies
pip install flask pandas scikit-learn statsmodels web3 flask-cors

# Start the Flask server
python app.py
```
*Backend will run on `http://127.0.0.1:5000`*

### **3. Frontend Setup (React)**
Open a **new terminal** in the project root:

```bash
# Install Node dependencies
npm install

# Start the development server
npm run dev
```
*Frontend will run on `http://localhost:5173` (or similar)*

### **4. Blockchain Setup (Ganache)**
1.  Open **Ganache**.
2.  Click **"Quickstart"**.
3.  Copy the **RPC Server URL** (usually `http://127.0.0.1:7545`).
4.  Ensure `app.py` is configured to connect to this URL (Default is set to `http://127.0.0.1:7545`).

---

## 📂 Project Structure (Folder ka naksha)

```
suraksha-login-portal/
├── app.py                 # 🐍 Main Flask Backend & ML Logic
├── csv_validator.py       # 🛡️ CSV Validation Logic
├── exceptions.py          # ⚠️ Custom Error Classes
├── index.html             # 🌐 Main HTML Entry
├── package.json           # 📦 Frontend Dependencies
├── vite.config.ts         # ⚡ Vite Configuration
├── public/                # 🖼️ Static Assets
└── src/
    ├── components/        # 🧩 Reusable UI Components (Charts, Cards, Modals)
    ├── pages/             # 📄 Main Pages (Login, Dashboard)
    ├── services/          # 🔌 API Integration (api.ts)
    └── App.tsx            # ⚛️ Main React App Component
```

---

## 📝 Usage Guide

1.  **Login:**
    *   **Username:** `tester`
    *   **Password:** `Pass@1205`
2.  **Dashboard:** View default data (2009-2010).
3.  **Upload:** Click **"Upload Dataset"** to analyze your own CSV.
4.  **Forecast:** See the 4-week sales prediction.
5.  **Verify:** Click **"Log to Blockchain"** to secure your forecast hash.

---

## 👨‍💻 Developed for REDACT Suraksha 2k25

*Made with ❤️ and ☕ by the ChainForecast Team.*
