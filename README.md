# Suraksha Login Portal – Hackathon Dashboard

## Overview
A **React + Vite** frontend paired with a **Flask** backend that:
- Loads the `online_retail_II.csv` dataset (UK retail data).
- Generates a 4‑week sales forecast using **Linear Regression** (scikit‑learn).
- Performs **RFM segmentation** with quantile‑based scoring.
- Shows interactive charts (Chart.js & Recharts) with a premium glass‑morphism UI.
- Logs the forecast hash to a **Solidity** smart‑contract on a local Ganache blockchain.
- Displays all monetary values in **British Pounds (£)**.

The project is structured to be easy to run locally for the REDACT 2k25 hackathon.

---

## Prerequisites
- **Node.js** (v18+ recommended) – for the frontend.
- **Python** (3.9+ recommended).
- **Git** – to clone the repo.
- **Ganache CLI** (or Ganache UI) – local Ethereum blockchain.
- **solc** (Solidity compiler) – installed via `py-solc-x`.

---

## Getting Started
### 1. Clone the repository
```bash
git clone https://github.com/MayureshTardekar/suraksha-login-portal.git
cd suraksha-login-portal
```

### 2. Install Python dependencies
```bash
# (optional) create a virtual environment
python -m venv venv
# activate it
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
```
> **Note:** `requirements.txt` includes `flask`, `flask-cors`, `pandas`, `numpy`, `web3`, `scikit-learn`, and `py-solc-x`.

### 3. Install frontend dependencies
```bash
npm install
```

### 4. Start Ganache (local blockchain)
```bash
# If you have Ganache CLI installed globally:
ganache-cli -p 8545
# Or start the Ganache UI and ensure the RPC server is listening on http://127.0.0.1:8545
```
The backend will automatically compile and deploy `ForecastLogger.sol` on startup.

### 5. Run the Flask backend
```bash
python app.py
```
You should see output similar to:
```
✅ Contract Deployed at: 0x....
 * Running on http://127.0.0.1:5000/ (Press CTRL+C to quit)
```
The API is now available at `http://localhost:5000/api/dashboard`.

### 6. Run the React frontend
Open a **new terminal** (keep the backend running) and execute:
```bash
npm run dev
```
The dev server will start, typically at `http://localhost:5173`. It proxies `/api` calls to the Flask backend automatically (see `vite.config.ts`).

### 7. Open the dashboard
Navigate to the URL shown by Vite (e.g., `http://localhost:5173`). You should see:
- KPI card with total 4‑week forecast in £.
- Line chart with historical sales + AI forecast.
- Country & product bar charts.
- RFM donut chart and top‑10 customers table.
- Buttons to export CSV/Excel and log the forecast hash to the blockchain.

---

## Project Structure
```
├─ src/                     # React source code
│   ├─ components/          # UI components (cards, tables, charts)
│   ├─ pages/               # Dashboard page
│   └─ services/api.ts      # Calls Flask API and maps response
├─ ForecastLogger.sol       # Solidity contract for logging forecasts
├─ app.py                   # Flask backend (data loading, forecasting, blockchain)
├─ requirements.txt         # Python dependencies
├─ package.json             # Node dependencies
└─ online_retail_II.csv     # Dataset (≈90 MB) – used by the backend
```

---

## Exporting Data
The **Export** button on the dashboard lets you download:
- CSV report (`sales-report_*.csv`).
- Excel workbook (`sales-report_*.xlsx`).
Both include the forecast, historical data, country & product breakdowns, and top customers.

---

## Blockchain Interaction
- The backend compiles `ForecastLogger.sol` with `solcx` and deploys it to Ganache on startup.
- Clicking **Log to Blockchain** sends the SHA‑256 forecast hash and total forecast amount to the contract, returning a transaction hash displayed on the UI.
- Transaction hashes can be verified on a local Etherscan‑like explorer if you run one, or simply view them in the Ganache UI.

---

## Troubleshooting
- **Ganache not running** – The backend will fall back to a self‑transaction but will log a warning. Start Ganache before `python app.py`.
- **Large CSV warning** – GitHub warns about the 90 MB CSV. It’s already in the repo; for future updates consider using **Git LFS**.
- **Missing Python packages** – Ensure you’re using the virtual environment and run `pip install -r requirements.txt` again.
- **Port conflicts** – Backend runs on `5000`; Vite dev server on `5173`. Adjust `vite.config.ts` proxy if you change ports.

---

## License
This project is open‑source and intended for the **REDACT 2k25 hackathon**. Feel free to fork, modify, and submit.

---

*Happy hacking!* 🎉
