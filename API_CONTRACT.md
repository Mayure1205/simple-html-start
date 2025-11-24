# API Contract Documentation - Phase 1 Upgrade

## Overview
This document describes the Phase 1 API enhancements for the analytics dashboard. All endpoints use existing Flask backend with pandas analytics.

---

## New/Enhanced Endpoints

### 1. GET `/api/dashboard`

**Description**: Main dashboard data endpoint (enhanced with Phase 1 additions)

**Query Parameters**:
- `from` (optional): Start date filter (YYYY-MM-DD)
- `to` (optional): End date filter (YYYY-MM-DD)
- `forecast_horizon` (optional): Forecast weeks (2, 4, 8, or 12). Default: 4

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "forecast": {
      "totalForecast": 12500.50,
      "historical": [
        { "date": "2024-01-01", "sales": 1000 },
        { "date": "2024-01-08", "sales": 1200 }
      ],
      "forecast": [
        { "week": "2024-02-01", "sales": 1100, "lower": 900, "upper": 1300 }
      ],
      "accuracy": {
        "accuracy": 0.95,
        "mape": 5.2,
        "rmse": 125.3,
        "r2": 0.89,
        "confidence": "HIGH"
      }
    },
    "rfm": {
      "available": true,
      "segmentCounts": { "Champions": 50, "Loyal Customers": 120 },
      "topCustomers": [
        {
          "id": "12345",
          "amount": 5000,
          "segment": "Champions",
          "offer": "VIP Access + 20% Off"
        }
      ]
    },
    "countries": [
      { "country": "United Kingdom", "value": 8500 },
      { "country": "Germany", "value": 6200 }
    ],
    "products": [
      { "product": "WHITE HANGING HEART", "value": 2500 },
      { "product": "REGENCY CAKESTAND", "value": 1800 }
    ],
    "hash": "a3f2b1c9d8e7f6...",
    "root_cause": {
      "period": "Week 5",
      "change_amount": 500,
      "change_percent": 12.5,
      "top_gainer": { "name": "Product A", "amount": 800 },
      "top_loser": { "name": "Product B", "amount": -300 },
      "top_country": "United Kingdom",
      "explanation": "Sales increased by 12.5% due to..."
    },
    "years": [2024, 2023, 2022],
    "metric_label": "Sales",
    "capabilities": {
      "hasProducts": true,
      "hasRegions": true,
      "hasCustomers": true
    },

    // ========== PHASE 1 ADDITIONS ==========
    "kpi": {
      "total_value": 125000.50,
      "growth_percent": 15.3,
      "avg_per_week": 3125.01,
      "transaction_count": 5420
    },
    "column_mapping": {
      "date_col": "InvoiceDate",
      "value_col": "Quantity",
      "product_col": "Description",
      "region_col": "Country",
      "customer_col": "CustomerID"
    },
    "date_range": {
      "from": "2024-01-01",
      "to": "2024-03-31"
    },
    "dataset_name": "sales_data_2024.csv"
  }
}
```

**KPI Calculations**:
- `total_value`: Sum of all transactions in filtered date range
- `growth_percent`: ((current_total - previous_period_total) / previous_period_total) * 100
- `avg_per_week`: total_value / number_of_weeks
- `transaction_count`: Number of rows in filtered dataset

---

### 2. GET `/api/reconcile` (NEW)

**Description**: Reconciliation check - recomputes totals from raw data

**Query Parameters**:
- `from` (optional): Start date filter (YYYY-MM-DD)
- `to` (optional): End date filter (YYYY-MM-DD)
- `displayed_total` (optional): Total shown in UI for comparison

**Response (200 OK)**:
```json
{
  "success": true,
  "actual_total": 125000.50,
  "match": true,
  "difference": 0.0
}
```

**Logic**:
1. Apply same filters as dashboard endpoint
2. Recompute total directly from `df_filtered[value_col].sum()`
3. Compare with `displayed_total` if provided
4. Return match status (tolerance: ±0.01 for floating point)

**Error Response (400/500)**:
```json
{
  "success": false,
  "error": "No data available"
}
```

---

### 3. POST `/api/upload-csv`

**Description**: Upload CSV file (already exists, enhanced with field detection)

**Form Data**:
- `file`: CSV file (multipart/form-data)

**Response (200 OK) - High Confidence**:
```json
{
  "success": true,
  "message": "File uploaded and fields auto-detected!",
  "filename": "sales_data.csv",
  "mapping": {
    "date": "InvoiceDate",
    "value": "Quantity",
    "product": "Description",
    "region": "Country",
    "customer": "CustomerID"
  },
  "confidence": "high",
  "warnings": [],
  "requires_mapping": false,
  "auto_detected": true
}
```

**Response (200 OK) - Needs Confirmation**:
```json
{
  "success": true,
  "message": "Please confirm or adjust field mapping",
  "filename": "sales_data.csv",
  "columns": ["Date", "Amount", "Product", "Region"],
  "suggested_mapping": {
    "date": "Date",
    "value": "Amount",
    "product": "Product",
    "region": "Region"
  },
  "confidence": "medium",
  "confidence_scores": {
    "date": 0.85,
    "value": 0.75,
    "product": 0.60
  },
  "warnings": ["Customer column not detected"],
  "missing_required": [],
  "requires_mapping": true,
  "auto_detected": false
}
```

---

### 4. POST `/api/save-mapping`

**Description**: Save column mapping (already exists)

**Request Body**:
```json
{
  "date_col": "InvoiceDate",
  "value_col": "Quantity",
  "product_col": "Description",
  "region_col": "Country",
  "customer_col": "CustomerID"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Mapping saved successfully"
}
```

---

## Frontend Integration Notes

### Context Banner
- Uses: `dataset_name`, `date_range`, `column_mapping`, `metric_label`
- Updates on every data fetch

### KPI Cards
- Displays: `kpi.total_value`, `kpi.growth_percent`, `kpi.avg_per_week`, `kpi.transaction_count`
- Growth % shows green/red based on positive/negative

### Reconciliation Check
- Calls `/api/reconcile` with same date filters as dashboard
- Compares `actual_total` vs displayed KPI total
- Shows green checkmark if match, red warning if mismatch

### Widget Unlock Guidance
- Checks `column_mapping.product_col` - if null/undefined, shows "Map Product column"
- Checks `column_mapping.region_col` - if null/undefined, shows "Map Region column"  
- Checks `capabilities.hasCustomers` - if false, shows "Map Customer ID column"

### Forecast Chart Enhancements
- `forecast[].lower` and `forecast[].upper` → shaded confidence band (Area chart)
- Anomaly detection: Frontend calculates deviation > 30% from avg → red dot marker

---

## Error Handling

All endpoints return consistent error format:

```json
{
  "success": false,
  "error": "Descriptive error message"
}
```

**Common Errors**:
- `No data available. Please upload a CSV file` (400)
- `No data available for selected date range` (400)
- `Insufficient data for X-week forecast` (400)
- `Server error: [details]` (500)

---

## Notes

1. **All analytics use filtered dataset**: `df_filtered` applies date range before calculations
2. **No synthetic data**: All values computed from actual CSV data
3. **Cache handling**: Date range changes invalidate cache via mapping key
4. **Backward compatible**: Existing endpoints unchanged, only additions
5. **Column mapping**: Stored in `CURRENT_MAPPING` global, persists across requests
