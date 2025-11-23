import { DateRange } from "react-day-picker";

export interface DashboardData {
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

let cachedData: DashboardData | null = null;
let cachedDateRange: string | null = null;

export const fetchDashboardData = async (dateRange?: DateRange): Promise<DashboardData> => {
  // Show loading state
  await new Promise((resolve) => setTimeout(resolve, 500));

  console.log("Fetching data from API...");

  try {
    // Build query string with date range
    const params = new URLSearchParams();
    if (dateRange?.from) {
      params.append('from', dateRange.from.toISOString().split('T')[0]);
    }
    if (dateRange?.to) {
      params.append('to', dateRange.to.toISOString().split('T')[0]);
    }

    const queryString = params.toString();
    const url = queryString ? `/api/dashboard?${queryString}` : '/api/dashboard';

    const response = await fetch(url);
    const text = await response.text();

    let result;
    try {
      result = text ? JSON.parse(text) : {};
    } catch (e) {
      console.error("Failed to parse JSON:", text);
      throw new Error(`Invalid JSON response from server: ${text.substring(0, 100)}...`);
    }

    if (!response.ok) {
      // Backend returned error (400, 500, etc.)
      throw new Error(result.error || `HTTP ${response.status}: Backend error`);
    }

    if (result.success) {
      const data = result.data;
      console.log("✅ Data loaded from API! (Real data from CSV)");
      console.log("📍 Countries from dataset:", data.countries?.map((c: any) => c.country).join(', '));

      // Map API response to DashboardData interface
      return {
        total_forecast: data.forecast.totalForecast,
        historical: data.forecast.historical.map((h: any) => ({
          week: h.date,
          sales: h.sales
        })),
        forecast: data.forecast.forecast,
        countries: data.countries.map((c: any) => ({
          country: c.country,
          sales: c.sales
        })),
        products: data.products.map((p: any) => ({
          product: p.product,
          quantity: p.quantity
        })),
        rfm: Object.entries(data.rfm.segmentCounts).map(([segment, count]) => ({
          segment,
          count: count as number,
          color: getSegmentColor(segment)
        })),
        customers: data.rfm.topCustomers.map((c: any) => ({
          id: c.id,
          monetary: c.amount,
          segment: c.segment,
          offer: c.offer
        })),
        hash: data.hash,
        tx_hash: 'Pending...'
      };
    } else {
      // Backend returned error - throw it to be caught by Dashboard
      throw new Error(result.error || 'API returned error');
    }
  } catch (error) {
    console.error("❌ Error loading API data:", error);
    // Re-throw the error instead of falling back to mock data
    throw error;
    console.warn("⚠️ NOTE: Mock data shows sample UK-based countries. Real data will show actual countries from CSV when backend is running.");
    return getMockData();
  }
};

const getSegmentColor = (segment: string) => {
  const colors: Record<string, string> = {
    'Champions': 'hsl(var(--chart-1))',
    'Loyal Customers': 'hsl(var(--chart-2))',
    'At Risk': 'hsl(var(--chart-4))',
    'Potential Loyalists': 'hsl(var(--chart-5))',
    'Lost': 'hsl(var(--chart-3))',
    'Standard': 'hsl(var(--chart-3))'
  };
  return colors[segment] || 'hsl(var(--chart-3))';
};

// Fallback mock data in case CSV loading fails
const getMockData = (): DashboardData => {
  return {
    total_forecast: 18423500,
    historical: [
      { week: '27 Nov', sales: 4200000 },
      { week: '04 Dec', sales: 4350000 },
      { week: '11 Dec', sales: 4100000 },
      { week: '18 Dec', sales: 4450000 },
    ],
    forecast: [
      { week: '25 Dec (Christmas)', sales: 4950000, lower: 4700000, upper: 5200000 },
      { week: '01 Jan', sales: 4600000, lower: 4350000, upper: 4850000 },
      { week: '08 Jan', sales: 4650000, lower: 4400000, upper: 4900000 },
      { week: '15 Jan', sales: 4623500, lower: 4370000, upper: 4870000 },
    ],
    countries: [
      { country: 'United Kingdom', sales: 8200000 },
      { country: 'Germany', sales: 6200000 },
      { country: 'France', sales: 5800000 },
      { country: 'EIRE', sales: 4200000 },
      { country: 'Spain', sales: 3800000 },
      { country: 'Netherlands', sales: 3500000 },
      { country: 'Belgium', sales: 3100000 },
      { country: 'Switzerland', sales: 2800000 },
      { country: 'Portugal', sales: 2500000 },
      { country: 'Australia', sales: 2200000 },
    ],
    products: [
      { product: 'WHITE HANGING HEART T-LIGHT HOLDER', quantity: 8500 },
      { product: 'REGENCY CAKESTAND 3 TIER', quantity: 7200 },
      { product: 'JUMBO BAG RED RETROSPOT', quantity: 6800 },
      { product: 'ASSORTED COLOUR BIRD ORNAMENT', quantity: 6400 },
      { product: 'PARTY BUNTING', quantity: 5900 },
    ],
    rfm: [
      { segment: 'VIP', count: 1250, color: 'hsl(var(--chart-1))' },
      { segment: 'Loyal', count: 2100, color: 'hsl(var(--chart-2))' },
      { segment: 'At-Risk', count: 890, color: 'hsl(var(--chart-4))' },
      { segment: 'Normal', count: 3200, color: 'hsl(var(--chart-3))' },
    ],
    customers: [
      { id: 'C17841', monetary: 1874200, segment: 'VIP', offer: '15% VIP Discount' },
      { id: 'C14606', monetary: 1689000, segment: 'VIP', offer: '15% VIP Discount' },
      { id: 'C15311', monetary: 1523000, segment: 'VIP', offer: '15% VIP Discount' },
      { id: 'C14096', monetary: 1412000, segment: 'Loyal', offer: 'Early Access Sale' },
      { id: 'C13748', monetary: 1358000, segment: 'Loyal', offer: 'Early Access Sale' },
      { id: 'C17949', monetary: 1294000, segment: 'Loyal', offer: 'Loyalty Points 2x' },
      { id: 'C14911', monetary: 1182000, segment: 'Loyal', offer: 'Free Shipping' },
      { id: 'C13408', monetary: 1065000, segment: 'Normal', offer: '10% First Purchase' },
      { id: 'C15838', monetary: 987000, segment: 'At-Risk', offer: '20% Win-Back Offer' },
      { id: 'C12583', monetary: 932000, segment: 'At-Risk', offer: '20% Win-Back Offer' },
    ],
    hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    tx_hash: '0x742d35cc6634c0532925a3b844bc9e7fe3b0c44298fc1c149afbf4c8996fb924',
  };
};
