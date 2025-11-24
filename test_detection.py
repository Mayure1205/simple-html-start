"""
Quick test script for field detection
"""
import pandas as pd
from field_detector import detect_fields, validate_and_clean_data

# Test with a sample CSV structure
print("=" * 60)
print("Testing Auto-Detection Engine")
print("=" * 60)

# Test Case 1: Standard retail data
print("\n📊 Test Case 1: Standard Retail Data")
print("-" * 60)
df1 = pd.DataFrame({
    'InvoiceDate': ['2023-01-01', '2023-01-02', '2023-01-03'],
    'TotalAmount': [100.50, 200.75, 150.25],
    'Description': ['Product A', 'Product B', 'Product C'],
    'Country': ['USA', 'UK', 'USA'],
    'CustomerID': ['C001', 'C002', 'C003']
})

result1 = detect_fields(df1)
print(f"✅ Detected mapping: {result1['mapping']}")
print(f"✅ Confidence: {result1['confidence']}")
print(f"✅ Warnings: {result1['warnings']}")

# Test Case 2: Generic column names
print("\n📊 Test Case 2: Generic Column Names")
print("-" * 60)
df2 = pd.DataFrame({
    'col_1': ['2023-01-01', '2023-01-02', '2023-01-03'],
    'col_2': [100, 200, 150],
    'col_3': ['Item X', 'Item Y', 'Item Z']
})

result2 = detect_fields(df2)
print(f"⚠️  Detected mapping: {result2['mapping']}")
print(f"⚠️  Confidence: {result2['confidence']}")
print(f"⚠️  Warnings: {result2['warnings']}")

# Test Case 3: Missing required fields
print("\n📊 Test Case 3: Missing Date Column")
print("-" * 60)
df3 = pd.DataFrame({
    'product_name': ['A', 'B', 'C'],
    'price': [10, 20, 30],
    'stock': [100, 200, 150]
})

result3 = detect_fields(df3)
print(f"❌ Detected mapping: {result3['mapping']}")
print(f"❌ Confidence: {result3['confidence']}")
print(f"❌ Warnings: {result3['warnings']}")

print("\n" + "=" * 60)
print("✅ All tests completed!")
print("=" * 60)
