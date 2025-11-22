import { DateRange } from "react-day-picker";
import { loadAndProcessCSV } from "./dataProcessor";

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

  console.log("Fetching data for range:", dateRange);

  // Create a cache key from the date range
  const dateKey = dateRange ? `${dateRange.from?.toISOString()}-${dateRange.to?.toISOString()}` : 'all';

  // Clear cache if date range changed
  if (cachedDateRange !== dateKey) {
    cachedData = null;
    cachedDateRange = dateKey;
    console.log("🔄 Date range changed, clearing cache");
  }

  // Load data from CSV if not cached
  if (!cachedData) {
    try {
      const csvPath = '/data/online_retail_II.csv';
      console.log("Loading CSV from:", csvPath);
      cachedData = await loadAndProcessCSV(csvPath, dateRange);
      console.log("✅ Data loaded and processed successfully from CSV!");
    } catch (error) {
      console.error("❌ Error loading CSV data:", error);
      console.log("⚠️ Falling back to mock data");
      // Fallback to mock data if CSV loading fails
      return getMockData();
    }
  } else {
    console.log("📦 Using cached data");
  }

  return cachedData;
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
      { country: 'Maharashtra', sales: 8200000 },
      { country: 'Karnataka', sales: 6200000 },
      { country: 'Tamil Nadu', sales: 5800000 },
      { country: 'Delhi NCR', sales: 4200000 },
      { country: 'Gujarat', sales: 3800000 },
      { country: 'Telangana', sales: 3500000 },
      { country: 'West Bengal', sales: 3100000 },
      { country: 'Rajasthan', sales: 2800000 },
      { country: 'Kerala', sales: 2500000 },
      { country: 'Uttar Pradesh', sales: 2200000 },
      { country: 'Punjab', sales: 1800000 },
      { country: 'Haryana', sales: 1500000 },
    ],
    products: [
      { product: 'Ceramic Mug Set', quantity: 8500 },
      { product: 'Vintage Clock', quantity: 7200 },
      { product: 'Decorative Candles', quantity: 6800 },
      { product: 'Photo Frame', quantity: 6400 },
      { product: 'Tea Set', quantity: 5900 },
      { product: 'Wall Art', quantity: 5500 },
      { product: 'Kitchen Utensils', quantity: 5200 },
      { product: 'Throw Pillows', quantity: 4800 },
      { product: 'Jewelry Box', quantity: 4500 },
      { product: 'Plant Pot', quantity: 4200 },
      { product: 'Vase', quantity: 3800 },
      { product: 'Table Lamp', quantity: 3500 },
      { product: 'Coasters', quantity: 3200 },
      { product: 'Napkin Holder', quantity: 2900 },
      { product: 'Fruit Basket', quantity: 2600 },
      { product: 'Key Holder', quantity: 2300 },
      { product: 'Magazine Rack', quantity: 2000 },
      { product: 'Bookends', quantity: 1800 },
      { product: 'Desk Organizer', quantity: 1500 },
      { product: 'Pen Holder', quantity: 1200 },
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
