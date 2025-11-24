# 🧪 End-to-End Testing Plan - Dashboard Behavior Verification

**Objective**: Verify that the dashboard always recomputes analytics based on active dataset, mapping, date range, and forecast horizon.

---

## ✅ Test Scenarios

### **Scenario 1: Change Date Range**

**Steps**:
1. Open dashboard (should show "No data" initially)
2. Upload a CSV with at least 6 months of data
3. Note the current values:
   - Total Forecast: `_______`
   - Forecast chart: `_______`
   - Hash: `_______`
   - RCA explanation: `_______`
4. Change date range to "Last 30 days"
5. **Verify**:
   - ✅ Total Forecast changes (should be lower)
   - ✅ Forecast chart shows different curve
   - ✅ Hash changes
   - ✅ RCA explanation changes (different period)
   - ✅ Product/Region charts show only 30-day data
   - ✅ RFM segments recalculate

**Expected Behavior**: All metrics update to reflect only the selected 30 days.

---

### **Scenario 2: Change Forecast Horizon**

**Steps**:
1. With data loaded, note current values (4 weeks default):
   - Total Forecast (4 Weeks): `_______`
   - Forecast chart points: `_______`
   - Hash: `_______`
2. Change horizon dropdown to "8 Weeks"
3. **Verify**:
   - ✅ Title changes to "Total Forecast (8 Weeks)"
   - ✅ Total Forecast value changes (higher number)
   - ✅ Forecast chart shows 8 data points instead of 4
   - ✅ Hash changes
4. Change horizon to "2 Weeks"
5. **Verify**:
   - ✅ Title changes to "Total Forecast (2 Weeks)"
   - ✅ Total Forecast value changes (lower number)
   - ✅ Forecast chart shows 2 data points
   - ✅ Hash changes again

**Expected Behavior**: Forecast recalculates for each horizon, hash updates each time.

---

### **Scenario 3: Change Mapping (Value Column)**

**Steps**:
1. Upload a CSV with multiple numeric columns (e.g., `Quantity`, `Price`, `TotalAmount`)
2. In mapping modal, select `TotalAmount` as value column
3. Note current values:
   - Total Forecast: `_______`
   - Product chart values: `_______`
   - Hash: `_______`
4. Re-upload the same CSV
5. In mapping modal, select `Quantity` as value column instead
6. **Verify**:
   - ✅ Total Forecast changes (different metric)
   - ✅ Forecast chart shows different scale
   - ✅ Product chart shows quantity instead of amount
   - ✅ Region chart shows quantity instead of amount
   - ✅ RFM recalculates based on quantity
   - ✅ RCA explanation changes
   - ✅ Hash changes
   - ✅ Metric label shows "Quantity" instead of "Total Amount"

**Expected Behavior**: All analytics switch to the new value column.

---

### **Scenario 4: Upload Different Dataset**

**Steps**:
1. Upload `dataset_A.csv` (e.g., retail data)
2. Note current values:
   - Total Forecast: `_______`
   - Product count: `_______`
   - Hash: `_______`
3. Upload `dataset_B.csv` (e.g., finance data)
4. **Verify**:
   - ✅ Total Forecast changes completely
   - ✅ Forecast chart shows different pattern
   - ✅ Product chart shows different products (or hides if not mapped)
   - ✅ Region chart shows different regions (or hides if not mapped)
   - ✅ RFM shows different customers (or hides if not mapped)
   - ✅ RCA explanation is completely different
   - ✅ Hash changes
   - ✅ Year dropdown shows different years

**Expected Behavior**: Dashboard completely resets to reflect the new dataset.

---

### **Scenario 5: Widget Hiding (Missing Fields)**

**Steps**:
1. Upload a CSV with only `Date` and `Value` columns (no product, region, customer)
2. **Verify**:
   - ✅ Product chart shows: "Product data not available for this dataset"
   - ✅ Region chart shows: "Region data not available for this dataset"
   - ✅ RFM chart shows: "Customer segmentation unavailable (Customer ID not mapped)"
   - ✅ Customer table shows: "Customer details unavailable for this dataset"
   - ✅ Forecast still works (only needs date + value)
   - ✅ RCA shows overall change only (no product/region breakdown)

**Expected Behavior**: Widgets gracefully hide when required fields are missing.

---

### **Scenario 6: Insufficient Data Error**

**Steps**:
1. Upload a CSV with only 10 days of data
2. Select "4 Weeks" horizon
3. **Verify**:
   - ✅ Error message: "Insufficient data for 4-week forecast. Need at least 28 days, got 10 days."
   - ✅ Dashboard shows error overlay
4. Change horizon to "2 Weeks"
5. **Verify**:
   - ✅ Error message: "Insufficient data for 2-week forecast. Need at least 14 days, got 10 days."

**Expected Behavior**: Clear error messages when data is insufficient.

---

## 🎯 Critical Checks

### **Hash Consistency**
- [ ] Hash changes when forecast changes
- [ ] Hash stays same when nothing changes
- [ ] Hash is different for different datasets
- [ ] Hash is different for different date ranges
- [ ] Hash is different for different horizons

### **No Stale Data**
- [ ] Changing date range updates all metrics immediately
- [ ] Changing horizon updates forecast immediately
- [ ] Changing mapping updates all metrics immediately
- [ ] Uploading new dataset clears all old data

### **Graceful Degradation**
- [ ] Missing product column → Product chart hides
- [ ] Missing region column → Region chart hides
- [ ] Missing customer column → RFM/Customer table hide
- [ ] All required widgets still work with minimal data

---

## 📝 Test Results Template

**Date**: _______  
**Tester**: _______  
**Build**: npm run build (success ✅)

| Scenario | Status | Notes |
|----------|--------|-------|
| 1. Change Date Range | ⬜ Pass / ⬜ Fail | |
| 2. Change Forecast Horizon | ⬜ Pass / ⬜ Fail | |
| 3. Change Mapping | ⬜ Pass / ⬜ Fail | |
| 4. Upload Different Dataset | ⬜ Pass / ⬜ Fail | |
| 5. Widget Hiding | ⬜ Pass / ⬜ Fail | |
| 6. Insufficient Data Error | ⬜ Pass / ⬜ Fail | |

**Overall Result**: ⬜ All Pass / ⬜ Some Failures

**Issues Found**:
1. _______
2. _______

---

## 🔧 How to Run Tests

1. **Start Backend**:
   ```bash
   python app.py
   ```
   Should see: `Running on http://127.0.0.1:5000`

2. **Start Frontend**:
   ```bash
   npm run dev
   ```
   Should see: `Local: http://localhost:5173/`

3. **Open Browser**:
   Navigate to `http://localhost:5173/`

4. **Run Each Scenario**:
   Follow the steps above and check off each verification point

5. **Document Results**:
   Fill in the test results template

---

## ✅ Success Criteria

**All tests pass if**:
- ✅ Every metric updates when date range changes
- ✅ Forecast recalculates for each horizon
- ✅ Mapping changes affect all analytics
- ✅ New datasets completely reset the dashboard
- ✅ Widgets hide gracefully when fields missing
- ✅ Hash changes whenever forecast changes
- ✅ No stale data is ever shown

**If any test fails**: Document the specific behavior and we'll fix it.

---

**Ready to test!** 🚀
