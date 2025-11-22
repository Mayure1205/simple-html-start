import { CountryBarChart } from '@/components/charts/CountryBarChart';
import { ForecastLineChart } from '@/components/charts/ForecastLineChart';
import { ProductBarChart } from '@/components/charts/ProductBarChart';
import { RFMDonutChart } from '@/components/charts/RFMDonutChart';
import { CustomerTable } from '@/components/CustomerTable';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { DatePickerWithRange } from '@/components/DateRangePicker';
import { ExportButton } from '@/components/ExportButton';
import { HashCard } from '@/components/HashCard';
import { MetricCard } from '@/components/MetricCard';
import { OfferCard } from '@/components/OfferCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardData, fetchDashboardData } from '@/services/api';
import { subDays } from 'date-fns';
import { useEffect, useState } from 'react';
import { DateRange } from 'react-day-picker';
import { TrendingUp, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

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
      toast.error('Failed to load data. Check if backend is running on http://localhost:5000');
    } finally {
      setIsLoading(false);
    }
  };

  const [isBlockchainLoading, setIsBlockchainLoading] = useState(false);

  const logToBlockchain = async () => {
    if (!data) return;
    setIsBlockchainLoading(true);
    try {
        const response = await fetch('/api/log-blockchain', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                hash: data.hash,
                total_sales: data.total_forecast 
            })
        });
        const result = await response.json();
        if (result.success) {
            setData(prev => prev ? { ...prev, tx_hash: result.tx_hash } : null);
            toast.success('✅ Forecast logged to blockchain successfully!');
        } else {
            toast.error('⚠️ Blockchain logging failed. Is Ganache running on port 8545?');
        }
    } catch (error) {
        console.error("Failed to log to blockchain:", error);
        toast.error('❌ Cannot connect to blockchain. Start Ganache with: ganache-cli -p 8545');
    } finally {
        setIsBlockchainLoading(false);
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
            <div className="flex flex-col sm:flex-row gap-3">
              <DatePickerWithRange date={date} setDate={setDate} />
              <ExportButton data={data} dateRange={date} />
            </div>
          </div>

          {/* Total Forecast Metric */}
          <MetricCard
            title="Total 4-Week Forecasted Sales (AI Powered)"
            value={`£${data.total_forecast.toLocaleString()}`}
            icon={TrendingUp}
          />

          {/* Top Segment Offer */}
          {data.customers[0] && (
            <OfferCard
              segment={data.customers[0].segment}
              offer={data.customers[0].offer}
              description={`Recommended action for ${data.customers[0].segment} segment - our most valuable customer group with £${data.customers[0].monetary.toLocaleString()} average spend.`}
            />
          )}

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
            
            {data.tx_hash && data.tx_hash !== 'Pending...' ? (
                <HashCard
                  title="Blockchain Transaction Hash"
                  hash={data.tx_hash}
                  link={`https://etherscan.io/tx/${data.tx_hash}`}
                  verified={true}
                />
            ) : (
                <div className="glass-card p-6 flex flex-col items-center justify-center gap-4">
                    <h3 className="text-sm font-semibold">Blockchain Verification</h3>
                    <p className="text-xs text-muted-foreground text-center">
                        Log this forecast hash to the Ethereum blockchain (Ganache) for immutable proof.
                    </p>
                    <Button 
                        onClick={logToBlockchain} 
                        disabled={isBlockchainLoading}
                        className="w-full bg-gradient-to-r from-primary to-accent"
                    >
                        {isBlockchainLoading ? 'Mining Transaction...' : '⛓️ Log to Blockchain'}
                    </Button>
                </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
