import { Card } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Props {
  data: Array<{ country: string; value: number; percentage: number }>;
  metricLabel: string;
}

export const GeographicMap = ({ data, metricLabel }: Props) => {
  if (!data || data.length === 0) {
    return null;
  }

  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <Card className="glass-card p-6 border-2 border-primary/20">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Geographic Distribution</h3>
      </div>

      <div className="space-y-3">
        {data.slice(0, 10).map((country, idx) => {
          const widthPercent = (country.value / maxValue) * 100;
          
          return (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">
                    #{idx + 1}
                  </Badge>
                  <span className="font-medium">{country.country}</span>
                </div>
                <span className="text-muted-foreground">
                  {country.value.toLocaleString()} {metricLabel}
                </span>
              </div>
              
              <div className="h-6 bg-muted rounded-full overflow-hidden relative">
                <div
                  className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                  style={{ width: `${widthPercent}%` }}
                >
                  <span className="text-xs font-semibold text-white">
                    {country.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {data.length > 10 && (
        <p className="text-xs text-muted-foreground text-center mt-4">
          Showing top 10 of {data.length} countries
        </p>
      )}
    </Card>
  );
};
