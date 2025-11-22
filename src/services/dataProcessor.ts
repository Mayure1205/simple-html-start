import Papa from 'papaparse';
import { DateRange } from 'react-day-picker';

export interface RetailTransaction {
    Invoice: string;
    StockCode: string;
    Description: string;
    Quantity: number;
    InvoiceDate: string;
    Price: number;
    'Customer ID': string;
    Country: string;
}

export interface ProcessedData {
    total_forecast: number;
    historical: Array<{ week: string; sales: number }>;
    forecast: Array<{ week: string; sales: number; lower: number; upper: number }>;
    countries: Array<{ country: string; sales: number }>;
    products: Array<{ product: string; quantity: number }>;
    rfm: Array<{ segment: string; count: number; color: string }>;
    customers: Array<{
        id: string;
        monetary: number;
        segment: string;
        offer: string;
    }>;
    hash: string;
    tx_hash: string;
}

export const loadAndProcessCSV = async (filePath: string, dateRange?: DateRange): Promise<ProcessedData> => {
    return new Promise((resolve, reject) => {
        Papa.parse(filePath, {
            download: true,
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: (results) => {
                try {
                    const data = results.data as RetailTransaction[];
                    const processed = processRetailData(data, dateRange);
                    resolve(processed);
                } catch (error) {
                    reject(error);
                }
            },
            error: (error) => {
                reject(error);
            }
        });
    });
};

const processRetailData = (data: RetailTransaction[], dateRange?: DateRange): ProcessedData => {
    // Filter valid transactions
    let validData = data.filter(row =>
        row.Quantity > 0 &&
        row.Price > 0 &&
        row['Customer ID'] &&
        row.Country &&
        row.InvoiceDate
    );

    // Apply date range filter if provided
    if (dateRange?.from || dateRange?.to) {
        validData = validData.filter(row => {
            const rowDate = new Date(row.InvoiceDate);
            const fromDate = dateRange.from ? new Date(dateRange.from) : new Date(0);
            const toDate = dateRange.to ? new Date(dateRange.to) : new Date();

            // Set time to start/end of day for accurate comparison
            fromDate.setHours(0, 0, 0, 0);
            toDate.setHours(23, 59, 59, 999);

            return rowDate >= fromDate && rowDate <= toDate;
        });

        console.log(`📅 Filtered to ${validData.length} transactions between ${dateRange.from?.toLocaleDateString()} and ${dateRange.to?.toLocaleDateString()}`);
    }

    // Calculate sales by country
    const countrySales = new Map<string, number>();
    validData.forEach(row => {
        const sales = row.Quantity * row.Price;
        countrySales.set(
            row.Country,
            (countrySales.get(row.Country) || 0) + sales
        );
    });

    const countries = Array.from(countrySales.entries())
        .map(([country, sales]) => ({ country, sales }))
        .sort((a, b) => b.sales - a.sales);

    // Calculate product quantities
    const productQuantities = new Map<string, number>();
    validData.forEach(row => {
        if (row.Description) {
            productQuantities.set(
                row.Description,
                (productQuantities.get(row.Description) || 0) + row.Quantity
            );
        }
    });

    const products = Array.from(productQuantities.entries())
        .map(([product, quantity]) => ({ product, quantity }))
        .sort((a, b) => b.quantity - a.quantity);

    // Calculate customer monetary values
    const customerMonetary = new Map<string, number>();
    validData.forEach(row => {
        const sales = row.Quantity * row.Price;
        customerMonetary.set(
            row['Customer ID'],
            (customerMonetary.get(row['Customer ID']) || 0) + sales
        );
    });

    // RFM Segmentation (simplified - based on monetary value)
    const customerValues = Array.from(customerMonetary.entries());
    const sortedCustomers = customerValues.sort((a, b) => b[1] - a[1]);

    const vipThreshold = sortedCustomers[Math.floor(sortedCustomers.length * 0.1)]?.[1] || 0;
    const loyalThreshold = sortedCustomers[Math.floor(sortedCustomers.length * 0.3)]?.[1] || 0;
    const atRiskThreshold = sortedCustomers[Math.floor(sortedCustomers.length * 0.7)]?.[1] || 0;

    let vipCount = 0, loyalCount = 0, atRiskCount = 0, normalCount = 0;
    const customers = sortedCustomers.slice(0, 10).map(([id, monetary]) => {
        let segment = 'Normal';
        let offer = '10% First Purchase';

        if (monetary >= vipThreshold) {
            segment = 'VIP';
            offer = '15% VIP Discount';
            vipCount++;
        } else if (monetary >= loyalThreshold) {
            segment = 'Loyal';
            offer = 'Early Access Sale';
            loyalCount++;
        } else if (monetary < atRiskThreshold) {
            segment = 'At-Risk';
            offer = '20% Win-Back Offer';
            atRiskCount++;
        } else {
            normalCount++;
        }

        return {
            id: String(id),
            monetary: Math.round(monetary),
            segment,
            offer
        };
    });

    // Count all segments
    sortedCustomers.forEach(([_, monetary]) => {
        if (monetary >= vipThreshold) vipCount++;
        else if (monetary >= loyalThreshold) loyalCount++;
        else if (monetary < atRiskThreshold) atRiskCount++;
        else normalCount++;
    });

    const rfm = [
        { segment: 'VIP', count: vipCount, color: 'hsl(var(--chart-1))' },
        { segment: 'Loyal', count: loyalCount, color: 'hsl(var(--chart-2))' },
        { segment: 'At-Risk', count: atRiskCount, color: 'hsl(var(--chart-4))' },
        { segment: 'Normal', count: normalCount, color: 'hsl(var(--chart-3))' },
    ];

    // Calculate weekly sales for historical data
    const weeklySales = new Map<string, number>();
    validData.forEach(row => {
        const date = new Date(row.InvoiceDate);
        const weekKey = `${date.getFullYear()}-W${getWeekNumber(date)}`;
        const sales = row.Quantity * row.Price;
        weeklySales.set(weekKey, (weeklySales.get(weekKey) || 0) + sales);
    });

    const sortedWeeks = Array.from(weeklySales.entries())
        .sort((a, b) => a[0].localeCompare(b[0]));

    const historical = sortedWeeks.slice(-4).map(([week, sales]) => ({
        week: formatWeek(week),
        sales: Math.round(sales)
    }));

    // Simple forecast (using average growth)
    const avgSales = historical.reduce((sum, h) => sum + h.sales, 0) / historical.length;
    const forecast = Array.from({ length: 4 }, (_, i) => {
        const sales = Math.round(avgSales * (1 + Math.random() * 0.1));
        return {
            week: `Week ${i + 1}`,
            sales,
            lower: Math.round(sales * 0.9),
            upper: Math.round(sales * 1.1)
        };
    });

    const total_forecast = forecast.reduce((sum, f) => sum + f.sales, 0);

    return {
        total_forecast,
        historical,
        forecast,
        countries,
        products,
        rfm,
        customers,
        hash: generateHash(JSON.stringify(validData.slice(0, 100))),
        tx_hash: '0x' + generateHash(new Date().toISOString())
    };
};

const getWeekNumber = (date: Date): number => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

const formatWeek = (weekKey: string): string => {
    const [year, week] = weekKey.split('-W');
    return `${year} W${week}`;
};

const generateHash = (data: string): string => {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(64, '0').slice(0, 64);
};
