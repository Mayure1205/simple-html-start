import { DateRange } from "react-day-picker";
import { toast } from "@/hooks/use-toast";

export interface DashboardData {
  total_forecast: number;
  historical: Array<{ week: string; sales: number }>;
  forecast: Array<{ week: string; sales: number; lower: number; upper: number }>;
  countries: Array<{ country: string; value: number }>;
  products: Array<{ product: string; value: number }>;
  rfm: {
    available: boolean;
    segmentCounts: Record<string, number>;
    topCustomers: Array<{
      id: string;
      amount: number;
      segment: string;
      offer: string;
    }>;
  };
  customers: Array<{
    id: string;
    amount: number;
    segment: string;
    offer: string;
  }>;
  hash: string;
  tx_hash: string;
  metric_label: string;
  capabilities?: {
    hasProducts: boolean;
    hasRegions: boolean;
    hasCustomers: boolean;
  };
  accuracy?: {
    accuracy: number;
    mape: number;
    rmse: number;
    r2: number;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';
  };
  root_cause?: {
    period: string;
    change_amount: number;
    change_percent: number;
    top_gainer?: { name: string; amount: number };
    top_loser?: { name: string; amount: number };
    top_country?: string;
    explanation: string;
  };
  years?: number[];
  // Phase 1 additions
  kpi?: {
    total_value: number;
    growth_percent: number;
    avg_per_week: number;
    transaction_count: number;
  };
  column_mapping?: {
    date_col?: string;
    value_col?: string;
    product_col?: string;
    region_col?: string;
    customer_col?: string;
  };
  date_range?: {
    from: string;
    to: string;
  };
  dataset_name?: string;
}

let cachedData: DashboardData | null = null;
let cachedDateRange: string | null = null;

export const fetchDashboardData = async (
  dateRange?: DateRange,
  forecastHorizon?: number
): Promise<DashboardData> => {
  // Show loading state
  await new Promise((resolve) => setTimeout(resolve, 500));

  console.log("Fetching data from API...");

  try {
    // Build query string with date range and forecast horizon
    const params = new URLSearchParams();
    if (dateRange?.from) {
      params.append('from', dateRange.from.toISOString().split('T')[0]);
    }
    if (dateRange?.to) {
      params.append('to', dateRange.to.toISOString().split('T')[0]);
    }
    if (forecastHorizon) {
      params.append('forecast_horizon', forecastHorizon.toString());
    }

    const queryString = params.toString();
    const url = queryString ? `/api/dashboard?${queryString}` : '/api/dashboard';

    // Timeout warning for slow forecasts
    let timeoutWarning: NodeJS.Timeout | null = null;
    let warningShown = false;
    
    const fetchPromise = fetch(url);
    
    // Show warning if request takes longer than 15 seconds
    timeoutWarning = setTimeout(() => {
      warningShown = true;
      console.warn("⏳ Forecast is taking longer than usual. Please wait...");
      toast({
        title: "Processing Forecast",
        description: "Forecast is taking longer than usual. Please wait...",
        duration: 10000,
      });
    }, 15000);
    
    const response = await fetchPromise;
    
    // Clear timeout if request completed
    if (timeoutWarning) {
      clearTimeout(timeoutWarning);
    }
    
    // Show success if warning was shown
    if (warningShown) {
      toast({
        title: "Forecast Complete",
        description: "Analysis finished successfully!",
      });
    }
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
      const rfm = {
        available: Boolean(data.rfm?.available),
        segmentCounts: data.rfm?.segmentCounts || {},
        topCustomers: data.rfm?.topCustomers?.map((c: any) => ({
          id: c.id,
          amount: c.amount,
          segment: c.segment,
          offer: c.offer
        })) || []
      };

      return {
        total_forecast: data.forecast.totalForecast,
        historical: data.forecast.historical.map((h: any) => ({
          week: h.date,
          sales: h.sales
        })),
        forecast: data.forecast.forecast,
        countries: data.countries || [],
        products: data.products || [],
        rfm,
        customers: rfm.topCustomers,
        hash: data.hash,
        tx_hash: 'Pending...',
        accuracy: data.forecast.accuracy,
        root_cause: data.root_cause,
        years: data.years,
        metric_label: data.metric_label || 'Metric',
        capabilities: data.capabilities || { hasProducts: true, hasRegions: true, hasCustomers: true },
        // Phase 1 additions
        kpi: data.kpi,
        column_mapping: data.column_mapping,
        date_range: data.date_range,
        dataset_name: data.dataset_name,
      };
    } else {
      // Backend returned error - throw it to be caught by Dashboard
      throw new Error(result.error || 'API returned error');
    }
  } catch (error) {
    console.error("❌ Error loading API data:", error);
    cachedData = null;
    
    // User-friendly error messages
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        toast({
          title: "Network Error",
          description: "Unable to connect to the server. Please check your connection and try again.",
          variant: "destructive",
        });
      } else if (error.message.includes('timeout')) {
        toast({
          title: "Request Timeout",
          description: "The forecast request took too long. Please try again with a shorter date range or smaller dataset.",
          variant: "destructive",
        });
      }
    }
    
    throw error;
  }
};

