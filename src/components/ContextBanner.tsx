import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database, Calendar, MapPin, Package, User, Tag } from 'lucide-react';

interface ColumnMapping {
  date_col?: string;
  value_col?: string;
  product_col?: string;
  region_col?: string;
  customer_col?: string;
}

interface Props {
  datasetName: string;
  dateRange: { from: string; to: string } | null;
  columnMapping: ColumnMapping;
  metricLabel: string;
}

export const ContextBanner = ({ datasetName, dateRange, columnMapping, metricLabel }: Props) => {
  return (
    <Card className="glass-card p-4 border-l-4 border-l-primary">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Dataset Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Database className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Active Dataset</p>
            <p className="text-sm font-semibold">{datasetName}</p>
          </div>
        </div>

        {/* Date Range */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-accent" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Date Range</p>
            <p className="text-sm font-semibold">
              {dateRange ? `${dateRange.from} → ${dateRange.to}` : 'All Time'}
            </p>
          </div>
        </div>

        {/* Metric Type */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
            <Tag className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Metric Type</p>
            <p className="text-sm font-semibold">{metricLabel}</p>
          </div>
        </div>

        {/* Column Mappings */}
        <div className="md:col-span-2 lg:col-span-3">
          <p className="text-xs text-muted-foreground mb-2">Active Column Mappings:</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="gap-1">
              <Calendar className="w-3 h-3" />
              Date: {columnMapping.date_col || 'Not Mapped'}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Tag className="w-3 h-3" />
              Value: {columnMapping.value_col || 'Not Mapped'}
            </Badge>
            {columnMapping.product_col && (
              <Badge variant="outline" className="gap-1 bg-green-500/10 border-green-500/20">
                <Package className="w-3 h-3" />
                Product: {columnMapping.product_col}
              </Badge>
            )}
            {columnMapping.region_col && (
              <Badge variant="outline" className="gap-1 bg-blue-500/10 border-blue-500/20">
                <MapPin className="w-3 h-3" />
                Region: {columnMapping.region_col}
              </Badge>
            )}
            {columnMapping.customer_col && (
              <Badge variant="outline" className="gap-1 bg-purple-500/10 border-purple-500/20">
                <User className="w-3 h-3" />
                Customer: {columnMapping.customer_col}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
