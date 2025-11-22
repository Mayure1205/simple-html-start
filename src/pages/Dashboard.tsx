import { useEffect, useState } from 'react';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { MetricCard } from '@/components/MetricCard';
import { ForecastLineChart } from '@/components/charts/ForecastLineChart';
import { CountryBarChart } from '@/components/charts/CountryBarChart';
import { ProductBarChart } from '@/components/charts/ProductBarChart';
import { RFMDonutChart } from '@/components/charts/RFMDonutChart';
import { CustomerTable } from '@/components/CustomerTable';
import { HashCard } from '@/components/HashCard';
import { OfferCard } from '@/components/OfferCard';
import { DatePickerWithRange } from '@/components/DateRangePicker';
import { TrendingUp } from 'lucide-react';
import { fetchDashboardData, DashboardData } from '@/services/api';
import { Skeleton } from '@/components/ui/skeleton';
import { DateRange } from 'react-day-picker';
import { subDays } from 'date-fns';

const Dashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  useEffect(() => {
    loadData();
    // Auto-refresh every 60 seconds
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [date]); // Reload when date changes

  const loadData = async () => {
    setIsLoading(true);
    try {
      const dashboardData = await fetchDashboardData(date);
      setData(dashboardData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !data) {
    return (
      <div className="flex min-h-screen w-full">
        <DashboardSidebar />
        <main className="flex-1 p-8">
          <Skeleton className="h-32 w-full mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        </main>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex min-h-screen w-full bg-background">
      <DashboardSidebar />

      <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Dashboard
            </h1>
            <DatePickerWithRange date={date} setDate={setDate} />
          </div>

          {/* Header Metric */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <MetricCard
                title="Total 4-Week Forecasted Sales (AI Powered)"
                value={`₹${data.total_forecast.toLocaleString()}`}
                icon={TrendingUp}
              />
            </div>
            <OfferCard
              segment="VIP"
              offer="15% VIP Discount"
              description="Recommended for high-value customers to maintain loyalty and increase LTV."
            />
          </div>

          {/* Forecast Chart */}
          <ForecastLineChart
            historical={data.historical}
            forecast={data.forecast}
          />

          {/* Country and Product Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CountryBarChart data={data.countries} />
            <ProductBarChart data={data.products} />
          </div>

          {/* RFM Chart */}
          <RFMDonutChart data={data.rfm} />

          {/* Customer Table */}
          <CustomerTable customers={data.customers} />

          {/* Hash Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <HashCard
              title="SHA-256 Integrity Hash"
              hash={data.hash}
            />
            <HashCard
              title="Blockchain Transaction Hash"
              hash={data.tx_hash}
              link={`https://etherscan.io/tx/${data.tx_hash}`}
              verified={true}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
