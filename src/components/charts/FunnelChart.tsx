import { Card } from '@/components/ui/card';
import { Filter } from 'lucide-react';

interface Props {
  data: Array<{ stage: string; count: number; percentage: number }>;
  title?: string;
}

export const FunnelChart = ({ data, title = 'Customer Funnel' }: Props) => {
  if (!data || data.length === 0) {
    return null;
  }

  const maxCount = data[0]?.count || 1;

  return (
    <Card className="glass-card p-6 border-2 border-primary/20">
      <div className="flex items-center gap-2 mb-6">
        <Filter className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>

      <div className="space-y-4">
        {data.map((stage, idx) => {
          const widthPercent = (stage.count / maxCount) * 100;
          const colors = [
            'from-primary to-accent',
            'from-accent to-primary',
            'from-success to-primary',
            'from-gold to-accent',
          ];
          const colorClass = colors[idx % colors.length];

          return (
            <div key={idx} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{stage.stage}</span>
                <span className="text-muted-foreground">
                  {stage.count.toLocaleString()} ({stage.percentage.toFixed(1)}%)
                </span>
              </div>
              
              <div className="relative">
                <div
                  className={`h-12 bg-gradient-to-r ${colorClass} rounded-lg shadow-lg flex items-center justify-center transition-all duration-500 relative overflow-hidden`}
                  style={{ width: `${widthPercent}%`, minWidth: '120px' }}
                >
                  <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                  <span className="text-white font-bold text-sm relative z-10">
                    {stage.count.toLocaleString()}
                  </span>
                </div>
              </div>

              {idx < data.length - 1 && (
                <div className="flex items-center justify-center">
                  <div className="w-px h-4 bg-border"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t text-xs text-muted-foreground">
        <p>Conversion Rate: {data[data.length - 1]?.percentage.toFixed(1)}%</p>
      </div>
    </Card>
  );
};
