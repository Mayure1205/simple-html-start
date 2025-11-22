import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DashboardData } from '@/services/api';
import { format } from 'date-fns';
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ExportButtonProps {
  data: DashboardData;
  dateRange?: { from?: Date; to?: Date };
}

export const ExportButton = ({ data, dateRange }: ExportButtonProps) => {
  const formatDateRange = () => {
    if (!dateRange?.from) return 'all-time';
    const from = format(dateRange.from, 'yyyy-MM-dd');
    const to = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
    return `${from}_to_${to}`;
  };

  const exportToCSV = () => {
    const dateRangeStr = formatDateRange();
    
    // Prepare sales forecast data
    const forecastData = [
      ['Sales Forecast Report'],
      [`Date Range: ${dateRange?.from ? format(dateRange.from, 'MMM dd, yyyy') : 'All Time'} - ${dateRange?.to ? format(dateRange.to, 'MMM dd, yyyy') : format(new Date(), 'MMM dd, yyyy')}`],
      [`Total Forecast: £${data.total_forecast.toLocaleString()}`],
      [],
      ['Historical Data'],
      ['Week', 'Sales (£)'],
      ...data.historical.map(h => [h.week, h.sales]),
      [],
      ['Forecast Data'],
      ['Week', 'Sales (£)', 'Lower Bound (£)', 'Upper Bound (£)'],
      ...data.forecast.map(f => [f.week, f.sales, f.lower, f.upper]),
      [],
      ['Country Sales'],
      ['Country', 'Sales (£)'],
      ...data.countries.map(c => [c.country, c.sales]),
      [],
      ['Product Quantities'],
      ['Product', 'Quantity'],
      ...data.products.map(p => [p.product, p.quantity]),
      [],
      ['Customer Segments (RFM)'],
      ['Segment', 'Count'],
      ...data.rfm.map(r => [r.segment, r.count]),
      [],
      ['Top Customers'],
      ['Customer ID', 'Monetary Value (£)', 'Segment', 'Recommended Offer'],
      ...data.customers.map(c => [c.id, c.monetary, c.segment, c.offer]),
    ];

    // Convert to CSV
    const csvContent = forecastData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `sales-report_${dateRangeStr}.csv`;
    link.click();
  };

  const exportToExcel = () => {
    const dateRangeStr = formatDateRange();
    
    // Create workbook
    const wb = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      ['Sales Forecast Report'],
      [`Date Range: ${dateRange?.from ? format(dateRange.from, 'MMM dd, yyyy') : 'All Time'} - ${dateRange?.to ? format(dateRange.to, 'MMM dd, yyyy') : format(new Date(), 'MMM dd, yyyy')}`],
      [`Total Forecast: ₹${data.total_forecast.toLocaleString()}`],
      [],
      ['Report Generated:', format(new Date(), 'MMM dd, yyyy HH:mm:ss')],
      ['Data Hash:', data.hash],
      ['Blockchain TX:', data.tx_hash],
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

    // Historical & Forecast sheet
    const forecastData = [
      ['Historical Data'],
      ['Week', 'Sales (₹)'],
      ...data.historical.map(h => [h.week, h.sales]),
      [],
      ['Forecast Data'],
      ['Week', 'Sales (₹)', 'Lower Bound (₹)', 'Upper Bound (₹)'],
      ...data.forecast.map(f => [f.week, f.sales, f.lower, f.upper]),
    ];
    const forecastSheet = XLSX.utils.aoa_to_sheet(forecastData);
    XLSX.utils.book_append_sheet(wb, forecastSheet, 'Sales Forecast');

    // Country sales sheet
    const countryData = [
      ['Country', 'Sales (₹)'],
      ...data.countries.map(c => [c.country, c.sales]),
    ];
    const countrySheet = XLSX.utils.aoa_to_sheet(countryData);
    XLSX.utils.book_append_sheet(wb, countrySheet, 'Country Sales');

    // Product quantities sheet
    const productData = [
      ['Product', 'Quantity'],
      ...data.products.map(p => [p.product, p.quantity]),
    ];
    const productSheet = XLSX.utils.aoa_to_sheet(productData);
    XLSX.utils.book_append_sheet(wb, productSheet, 'Products');

    // RFM segments sheet
    const rfmData = [
      ['Segment', 'Count'],
      ...data.rfm.map(r => [r.segment, r.count]),
    ];
    const rfmSheet = XLSX.utils.aoa_to_sheet(rfmData);
    XLSX.utils.book_append_sheet(wb, rfmSheet, 'Customer Segments');

    // Top customers sheet
    const customersData = [
      ['Customer ID', 'Monetary Value (₹)', 'Segment', 'Recommended Offer'],
      ...data.customers.map(c => [c.id, c.monetary, c.segment, c.offer]),
    ];
    const customersSheet = XLSX.utils.aoa_to_sheet(customersData);
    XLSX.utils.book_append_sheet(wb, customersSheet, 'Top Customers');

    // Write file
    XLSX.writeFile(wb, `sales-report_${dateRangeStr}.xlsx`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 glass-card hover:bg-white/10">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass-card">
        <DropdownMenuItem onClick={exportToCSV} className="cursor-pointer">
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToExcel} className="cursor-pointer">
          Export as Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
