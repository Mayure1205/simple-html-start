import { Card } from '@/components/ui/card';
import { CalendarDays } from 'lucide-react';

interface Props {
  data: Array<{ date: string; value: number }>;
  metricLabel: string;
}

export const HeatmapCalendar = ({ data, metricLabel }: Props) => {
  if (!data || data.length === 0) {
    return null;
  }

  // Group by date and sum values
  const dateMap = new Map<string, number>();
  data.forEach(item => {
    const existing = dateMap.get(item.date) || 0;
    dateMap.set(item.date, existing + item.value);
  });

  const dates = Array.from(dateMap.entries()).map(([date, value]) => ({ date, value }));
  const maxValue = Math.max(...dates.map(d => d.value), 1);

  // Get intensity color
  const getIntensity = (value: number) => {
    const ratio = value / maxValue;
    if (ratio === 0) return 'bg-muted';
    if (ratio < 0.25) return 'bg-primary/20';
    if (ratio < 0.5) return 'bg-primary/40';
    if (ratio < 0.75) return 'bg-primary/60';
    return 'bg-primary';
  };

  return (
    <Card className="glass-card p-6 border-2 border-primary/20">
      <div className="flex items-center gap-2 mb-4">
        <CalendarDays className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Daily Activity Heatmap</h3>
      </div>
      
      <div className="grid grid-cols-7 gap-2">
        {dates.slice(0, 49).map((item, idx) => (
          <div
            key={idx}
            className={`aspect-square rounded ${getIntensity(item.value)} border border-border/20 flex items-center justify-center group relative cursor-pointer hover:ring-2 hover:ring-primary transition-all`}
            title={`${item.date}: ${item.value.toLocaleString()} ${metricLabel}`}
          >
            <span className="text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              {new Date(item.date).getDate()}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-4 h-4 bg-muted rounded"></div>
          <div className="w-4 h-4 bg-primary/20 rounded"></div>
          <div className="w-4 h-4 bg-primary/40 rounded"></div>
          <div className="w-4 h-4 bg-primary/60 rounded"></div>
          <div className="w-4 h-4 bg-primary rounded"></div>
        </div>
        <span>More</span>
      </div>
    </Card>
  );
};
