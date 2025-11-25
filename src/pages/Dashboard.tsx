import { AccuracyBadge } from '@/components/AccuracyBadge';
import { CountryBarChart } from '@/components/charts/CountryBarChart';
import { ForecastLineChart } from '@/components/charts/ForecastLineChart';
import { ProductBarChart } from '@/components/charts/ProductBarChart';
import { RFMDonutChart } from '@/components/charts/RFMDonutChart';
import { HeatmapCalendar } from '@/components/charts/HeatmapCalendar';
import { WaterfallChart } from '@/components/charts/WaterfallChart';
import { GeographicMap } from '@/components/charts/GeographicMap';
import { FunnelChart } from '@/components/charts/FunnelChart';
import { ColumnMapping, ColumnMappingModal } from '@/components/ColumnMappingModal';
import { CSVUploadModal } from '@/components/CSVUploadModal';
import { CustomerTable } from '@/components/CustomerTable';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { DatePickerWithRange } from '@/components/DateRangePicker';
import { DisclaimerPopup } from '@/components/DisclaimerPopup';
import { ExportButton } from '@/components/ExportButton';
import { HashCard } from '@/components/HashCard';
import { MetricCard } from '@/components/MetricCard';
import { NoDataOverlay } from '@/components/NoDataOverlay';
import { OfferCard } from '@/components/OfferCard';
import { RootCauseCard } from '@/components/RootCauseCard';
import { ContextBanner } from '@/components/ContextBanner';
import { ReconciliationCheck } from '@/components/ReconciliationCheck';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardData, fetchDashboardData } from '@/services/api';
import { reconcileData } from '@/services/reconciliation';
import { Database, TrendingUp, TrendingDown, Activity, ShoppingCart } from 'lucide-react';
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
  
  // Mapping State
  const [isMappingModalOpen, setIsMappingModalOpen] = useState(false);
  const [mappingColumns, setMappingColumns] = useState<string[]>([]);
  const [mappingFile, setMappingFile] = useState('');

  // Date Range State (No default - shows all data initially)
  const [date, setDate] = useState<DateRange | undefined>(undefined);

  // Forecast Horizon State (Default: 4 weeks)
  const [forecastHorizon, setForecastHorizon] = useState<number>(4);


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
  }, [date, forecastHorizon, isInitialized]); // ← Added forecastHorizon dependency 

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

  const handleUploadSuccess = async (
    dateRange?: { from: string; to: string }, 
    columns?: string[], 
    filename?: string,
    suggested_mapping?: any,
    confidence?: string
  ) => {
    // ✅ AUTO-DETECTION SUCCESS - No mapping needed
    if (!columns || columns.length === 0) {
      toast.success('Dashboard loading with auto-detected fields...');
      await fetchCurrentFile();
      await loadData();
      return;
    }

    // ⚠️ NEEDS USER CONFIRMATION - Show mapping modal with suggestions
    if (columns && columns.length > 0 && filename) {
      setMappingColumns(columns);
      setMappingFile(filename);
      setIsMappingModalOpen(true);
      
      // Pre-fill suggested mapping if available
      if (suggested_mapping && confidence) {
        toast.info(`Auto-detected fields with ${confidence} confidence. Please confirm.`);
      }
      return;
    }

    // Fallback: Auto-adjust date picker if date range provided
    if (dateRange) {
      setDate({
        from: new Date(dateRange.from),
        to: new Date(dateRange.to),
      });
    }
    await fetchCurrentFile();
    await loadData();
  };

  const handleMappingConfirm = async (mapping: ColumnMapping) => {
    try {
        const response = await fetch('/api/save-mapping', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(mapping)
        });
        
        if (response.ok) {
            toast.success('Mapping saved! Loading dashboard...');
            setIsMappingModalOpen(false);
            await fetchCurrentFile();
            await loadData();
        } else {
            toast.error('Failed to save mapping');
        }
    } catch (error) {
        console.error('Mapping error:', error);
        toast.error('Failed to save mapping');
    }
  };


  const loadData = async () => {
    setIsLoading(true);
    try {
      const dashboardData = await fetchDashboardData(date, forecastHorizon);
      if (!dashboardData) throw new Error('No data received');
      setData(dashboardData);
      setHasNoData(false);
    } catch (error: any) {
      console.error('Failed to load dashboard data:', error);
      
      // Check if it's a "no data" or "insufficient data" error (not a real error)
      if (error.message && (error.message.includes('No data available') || error.message.includes('Insufficient data') || error.message.includes('upload a CSV'))) {
        // Don't show error toast if it's just "no CSV uploaded"
        if (!error.message.includes('upload a CSV')) {
          toast.warning(error.message);
        }
        setHasNoData(true);
        
        // If no data exists yet, set empty structure to allow rendering
        if (!data) {
          setData({
            total_forecast: 0,
            historical: [],
            forecast: [],
            countries: [],
            products: [],
            rfm: { available: false, segmentCounts: {}, topCustomers: [] },
            customers: [],
            hash: 'No Data',
            tx_hash: '',
            metric_label: 'Metric',
            capabilities: { hasProducts: false, hasRegions: false, hasCustomers: false }
          });
        }
      } else {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        toast.error(`Failed to load data: ${errorMsg}`);
        // Don't clear data on errors - keep showing the overlay
        setHasNoData(true);
        if (!data) {
          setData({
            total_forecast: 0,
            historical: [],
            forecast: [],
            countries: [],
            products: [],
            rfm: { available: false, segmentCounts: {}, topCustomers: [] },
            customers: [],
            hash: 'No Data',
            tx_hash: '',
            metric_label: 'Metric',
            capabilities: { hasProducts: false, hasRegions: false, hasCustomers: false }
          });
        }
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

  const formatValue = (value: number) => {
    if (!value) return '0';
    // Use proper comma formatting instead of k/M notation
    return value.toLocaleString('en-US', { 
      maximumFractionDigits: 0 
    });
  };

  const metricLabel = data.metric_label || 'Metric';
  const forecastTitle = `Total Forecast (${forecastHorizon} Weeks)`;
  const hasProductData = Boolean(data.capabilities?.hasProducts && data.products.length > 0);
  const hasRegionData = Boolean(data.capabilities?.hasRegions && data.countries.length > 0);
  const hasCustomerData = Boolean(data.rfm.available && data.customers.length > 0);

  const rfmChartData = data.rfm.available
    ? Object.entries(data.rfm.segmentCounts || {}).map(([segment, count]) => ({
        segment,
        count: count as number
      }))
    : [];

  return (
    <div className="flex min-h-screen w-full bg-background">
      <DashboardSidebar />

      <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Dash AI Analytics
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
              <DatePickerWithRange date={date} setDate={setDate} availableYears={data?.years ?? []} />
              
              {/* Forecast Horizon Selector */}
              <Select value={forecastHorizon.toString()} onValueChange={(value) => setForecastHorizon(parseInt(value))}>
                <SelectTrigger className="w-[140px] glass-card">
                  <SelectValue placeholder="Horizon" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 Weeks</SelectItem>
                  <SelectItem value="4">4 Weeks</SelectItem>
                  <SelectItem value="8">8 Weeks</SelectItem>
                  <SelectItem value="12">12 Weeks</SelectItem>
                </SelectContent>
              </Select>
              
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

          {/* Disclaimer Popup (shows on first visit) */}
          <DisclaimerPopup />

          {/* Context Banner */}
          <ContextBanner
            datasetName={data.dataset_name || currentFile}
            dateRange={data.date_range || null}
            columnMapping={data.column_mapping || {}}
            metricLabel={metricLabel}
          />

          <div className="space-y-6">
                {/* KPI Cards Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {data.kpi && (
                    <>
                      <MetricCard
                        title="Total Value"
                        value={`${formatValue(data.kpi.total_value)} ${metricLabel}`}
                        icon={TrendingUp}
                      />
                      <MetricCard
                        title="Growth vs Previous"
                        value={`${data.kpi.growth_percent >= 0 ? '+' : ''}${data.kpi.growth_percent.toFixed(1)}%`}
                        icon={data.kpi.growth_percent >= 0 ? TrendingUp : TrendingDown}
                      />
                      <MetricCard
                        title="Avg Per Week"
                        value={`${formatValue(data.kpi.avg_per_week)} ${metricLabel}`}
                        icon={Activity}
                      />
                      <MetricCard
                        title="Transactions"
                        value={formatValue(data.kpi.transaction_count)}
                        icon={ShoppingCart}
                      />
                    </>
                  )}
                </div>

                {/* Reconciliation Check */}
                <ReconciliationCheck
                  displayedTotal={data.kpi?.total_value || data.total_forecast}
                  onReconcile={reconcileData}
                />

                {/* Header Metrics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <MetricCard
                        title={forecastTitle}
                        value={`${formatValue(data.total_forecast)} ${metricLabel}`}
                        icon={TrendingUp}
                    />
                    
                    {/* Accuracy Badge */}
                    {data.accuracy && (
                      <AccuracyBadge metrics={data.accuracy} />
                    )}

                    {/* Root Cause Analysis Card */}
                    {data.root_cause && (
                      <RootCauseCard data={data.root_cause} />
                    )}
                </div>

                {/* Top Segment Offer */}
                {hasCustomerData && (
                <OfferCard
                    segment={data.customers[0].segment}
                    offer={data.customers[0].offer}
                    description={`Recommended action for ${data.customers[0].segment} segment – avg. contribution ${formatValue(data.customers[0].amount)} ${metricLabel}.`}
                />
                )}

                {/* Forecast Chart */}
                <div className="relative">
                  {hasNoData && (
                    <NoDataOverlay 
                      message={data.hash === 'No Data' && data.total_forecast === 0 ? "No CSV file uploaded yet" : "No data available for selected date range"}
                      showUploadButton={data.hash === 'No Data' && data.total_forecast === 0}
                      onUploadClick={() => setIsUploadModalOpen(true)}
                    />
                  )}
                  <ForecastLineChart
                      historical={data.historical}
                      forecast={data.forecast}
                      metricLabel={metricLabel}
                      horizon={forecastHorizon}
                  />
                </div>

                {/* Country and Product Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="relative">
                      {hasNoData && <NoDataOverlay />}
                      {hasRegionData ? (
                        <CountryBarChart data={data.countries} valueLabel={metricLabel} />
                      ) : (
                        <NoDataOverlay 
                          message="Map Region column to unlock Regional Insights" 
                        />
                      )}
                    </div>
                    <div className="relative">
                      {hasNoData && <NoDataOverlay />}
                      {hasProductData ? (
                        <ProductBarChart data={data.products} valueLabel={metricLabel} />
                      ) : (
                        <NoDataOverlay 
                          message="Map Product column to unlock Product Insights" 
                        />
                      )}
                    </div>
                </div>

                {/* NEW VISUALIZATIONS */}
                
                {/* Heatmap Calendar */}
                {data.historical && data.historical.length > 0 && (
                  <HeatmapCalendar
                    data={data.historical.map(h => ({ date: h.week, value: h.sales }))}
                    metricLabel={metricLabel}
                  />
                )}

                {/* Waterfall Chart */}
                {data.kpi && (
                  <WaterfallChart
                    data={{
                      total: data.kpi.total_value,
                      segments: [
                        { label: 'Previous Period', value: data.kpi.total_value / (1 + data.kpi.growth_percent / 100), isPositive: true },
                        { label: 'Growth', value: data.kpi.total_value - (data.kpi.total_value / (1 + data.kpi.growth_percent / 100)), isPositive: data.kpi.growth_percent >= 0 },
                      ]
                    }}
                    metricLabel={metricLabel}
                  />
                )}

                {/* Geographic Map */}
                {hasRegionData && (
                  <GeographicMap
                    data={data.countries.map((c, i, arr) => ({
                      ...c,
                      percentage: arr.reduce((sum, item) => sum + item.value, 0) > 0 
                        ? (c.value / arr.reduce((sum, item) => sum + item.value, 0)) * 100 
                        : 0
                    }))}
                    metricLabel={metricLabel}
                  />
                )}

                {/* Funnel Chart */}
                {hasCustomerData && rfmChartData.length >= 3 && (
                  <FunnelChart
                    data={(() => {
                      const totalCount = rfmChartData.reduce((sum, c) => sum + c.count, 0);
                      return [
                        { stage: 'Total Customers', count: totalCount, percentage: 100 },
                        { stage: 'VIP/Loyal', count: rfmChartData.filter(c => c.segment === 'VIP' || c.segment === 'Loyal').reduce((sum, c) => sum + c.count, 0), percentage: 0 },
                        { stage: 'Active VIP', count: rfmChartData.find(c => c.segment === 'VIP')?.count || 0, percentage: 0 },
                      ].map((s, i, arr) => ({ ...s, percentage: totalCount > 0 ? (s.count / totalCount) * 100 : 0 }));
                    })()}
                    title="Customer Engagement Funnel"
                  />
                )}

                {/* RFM Chart */}
                <div className="relative">
                  {hasNoData && <NoDataOverlay />}
                  {data.rfm.available && rfmChartData.length > 0 ? (
                    <RFMDonutChart data={rfmChartData} />
                  ) : (
                    <NoDataOverlay message="Map Customer ID column to unlock Customer Segmentation (RFM Analysis)" />
                  )}
                </div>

                {/* Customer Table */}
                <div className="relative">
                  {hasNoData && <NoDataOverlay />}
                  {hasCustomerData ? (
                    <CustomerTable customers={data.customers} metricLabel={metricLabel} />
                  ) : (
                    <NoDataOverlay message="Customer details unavailable for this dataset" />
                  )}
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

      <CSVUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
        currentFile={currentFile}
        isDefault={isDefaultFile}
      />

      <ColumnMappingModal
        isOpen={isMappingModalOpen}
        onClose={() => setIsMappingModalOpen(false)}
        columns={mappingColumns}
        fileName={mappingFile}
        onConfirm={handleMappingConfirm}
      />
    </div>
  );
};

export default Dashboard;
