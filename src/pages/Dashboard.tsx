import { CountryBarChart } from '@/components/charts/CountryBarChart';
import { ForecastLineChart } from '@/components/charts/ForecastLineChart';
import { ProductBarChart } from '@/components/charts/ProductBarChart';
import { RFMDonutChart } from '@/components/charts/RFMDonutChart';
import { CSVUploadModal } from '@/components/CSVUploadModal';
import { CustomerTable } from '@/components/CustomerTable';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { DatePickerWithRange } from '@/components/DateRangePicker';
import { ExportButton } from '@/components/ExportButton';
import { HashCard } from '@/components/HashCard';
import { MetricCard } from '@/components/MetricCard';
import { NoDataOverlay } from '@/components/NoDataOverlay';
import { OfferCard } from '@/components/OfferCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardData, fetchDashboardData } from '@/services/api';
import { Database, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { DateRange } from 'react-day-picker';
import { toast } from 'sonner';


const Dashboard = () => {
  // State Management (Yahan hum dashboard ka data aur UI state manage kar rahe hain)
  const [data, setData] = useState<DashboardData | null>(null); // Main dashboard data
  const [isLoading, setIsLoading] = useState(true); // Loading spinner state
  const [currentFile, setCurrentFile] = useState('online_retail_II.csv'); // Currently active CSV file
  const [isDefaultFile, setIsDefaultFile] = useState(true); // Check if using default dataset
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false); // Modal visibility
  const [hasNoData, setHasNoData] = useState(false); // Track if date range has no data
  
  // Date Range State (Default: 2009-2010 based on dataset)
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date('2009-12-01'),
    to: new Date('2010-12-31'),
  });


  const [isInitialized, setIsInitialized] = useState(false);

  // Initial Reset Effect (Runs once on mount/refresh)
  useEffect(() => {
    const resetBackend = async () => {
      try {
        await fetch('/api/reset-file', { method: 'POST' });
        setIsInitialized(true); // Allow data loading to proceed
      } catch (e) {
        console.error("Reset failed:", e);
        setIsInitialized(true); // Proceed anyway
      }
    };
    resetBackend();
  }, []);

  // Data Loading Effect
  useEffect(() => {
    if (!isInitialized) return; // Wait for reset to complete
    
    loadData();
    fetchCurrentFile();
    // Auto-refresh every 60 seconds
    const interval = setInterval(loadData, 60000);
    
    return () => {
        clearInterval(interval);
    };
  }, [date, isInitialized]); 

  const fetchCurrentFile = async () => {
    try {
      const response = await fetch('/api/current-file');
      const data = await response.json();
      if (data.success) {
        setCurrentFile(data.filename);
        setIsDefaultFile(data.is_default);
      }
    } catch (error) {
      console.error('Failed to fetch current file:', error);
    }
  };

  const handleUploadSuccess = async (dateRange?: { from: string; to: string }) => {
    // Auto-adjust date picker if date range provided
    if (dateRange) {
      setDate({
        from: new Date(dateRange.from),
        to: new Date(dateRange.to),
      });
    }
    // Refresh current file info
    await fetchCurrentFile();
    // Reload dashboard data with new CSV
    await loadData();
  };


  const loadData = async () => {
    setIsLoading(true);
    try {
      const dashboardData = await fetchDashboardData(date);
      if (!dashboardData) throw new Error('No data received');
      setData(dashboardData);
      setHasNoData(false);
    } catch (error: any) {
      console.error('Failed to load dashboard data:', error);
      
      // Check if it's a "no data" error (not a real error)
      if (error.message && error.message.includes('No data available')) {
        toast.warning(error.message);
        setHasNoData(true);
        
        // If no data exists yet, set empty structure to allow rendering
        if (!data) {
          setData({
            total_forecast: 0,
            historical: [],
            forecast: [],
            countries: [],
            products: [],
            rfm: [],
            customers: [],
            hash: 'No Data',
            tx_hash: ''
          });
        }
      } else {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        toast.error(`Failed to load data: ${errorMsg}`);
        // Clear data on real errors
        setData(null);
        setHasNoData(false);
      }
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
            if (result.already_logged) {
                toast.warning('⚠️ This forecast has already been logged to blockchain. Each unique forecast can only be logged once.');
            } else {
                toast.error(result.error || '⚠️ Blockchain logging failed. Is Ganache running on port 8545?');
            }
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsUploadModalOpen(true)}
                className="gap-2"
              >
                <Database className="h-4 w-4" />
                Upload Dataset
              </Button>
              <DatePickerWithRange date={date} setDate={setDate} />
              <ExportButton data={data} dateRange={date} />
            </div>
          </div>

          {/* Current Dataset Indicator */}
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 border border-primary/10 rounded-lg">
            <Database className="h-4 w-4 text-primary" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Currently Viewing:</p>
              <p className="text-sm font-medium">{currentFile}</p>
            </div>
            {!isDefaultFile && (
              <span className="text-xs px-2 py-1 bg-green-500/10 text-green-600 rounded-full border border-green-500/20">
                Custom Dataset
              </span>
            )}
          </div>

          {/* CSV Upload Modal */}
          <CSVUploadModal
            isOpen={isUploadModalOpen}
            onClose={() => setIsUploadModalOpen(false)}
            onUploadSuccess={handleUploadSuccess}
            currentFile={currentFile}
            isDefault={isDefaultFile}
          />

          <div className="space-y-6">
                {/* Header Metrics */}
                <div className="grid grid-cols-1 gap-6">
                    <MetricCard
                        title="Total Forecast (4 Weeks)"
                        value={`£${data.total_forecast.toLocaleString()}`}
                        icon={TrendingUp}
                    />
                </div>

                {/* Top Segment Offer */}
                {data.customers && data.customers.length > 0 && (
                <OfferCard
                    segment={data.customers[0].segment}
                    offer={data.customers[0].offer}
                    description={`Recommended action for ${data.customers[0].segment} segment - our most valuable customer group with £${data.customers[0].monetary.toLocaleString()} average spend.`}
                />
                )}

                {/* Forecast Chart */}
                <div className="relative">
                  {hasNoData && <NoDataOverlay />}
                  <ForecastLineChart
                      historical={data.historical}
                      forecast={data.forecast}
                  />
                </div>

                {/* Country and Product Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="relative">
                      {hasNoData && <NoDataOverlay />}
                      <CountryBarChart data={data.countries} />
                    </div>
                    <div className="relative">
                      {hasNoData && <NoDataOverlay />}
                      <ProductBarChart data={data.products} />
                    </div>
                </div>

                {/* RFM Chart */}
                <div className="relative">
                  {hasNoData && <NoDataOverlay />}
                  <RFMDonutChart data={data.rfm} />
                </div>

                {/* Customer Table */}
                <div className="relative">
                  {hasNoData && <NoDataOverlay />}
                  <CustomerTable customers={data.customers} />
                </div>

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
                                disabled={isBlockchainLoading || hasNoData}
                                className="w-full bg-gradient-to-r from-primary to-accent"
                            >
                                {isBlockchainLoading ? 'Mining Transaction...' : hasNoData ? 'No Data to Log' : '⛓️ Log to Blockchain'}
                            </Button>
                        </div>
                    )}
                </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
