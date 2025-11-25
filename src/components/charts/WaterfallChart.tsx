import { Card } from '@/components/ui/card';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { TrendingDown, TrendingUp } from 'lucide-react';

interface Props {
  data: {
    total: number;
    segments: Array<{ label: string; value: number; isPositive: boolean }>;
  };
  metricLabel: string;
}

export const WaterfallChart = ({ data, metricLabel }: Props) => {
  if (!data || !data.segments || data.segments.length === 0) {
    return null;
  }

  // Build waterfall data
  let cumulative = 0;
  const waterfallData = data.segments.map((segment, idx) => {
    const start = cumulative;
    cumulative += segment.value;
    return {
      name: segment.label,
      value: Math.abs(segment.value),
      start: Math.min(start, cumulative),
      end: Math.max(start, cumulative),
      isPositive: segment.isPositive,
      total: cumulative,
    };
  });

  return (
    <Card className="glass-card p-6 border-2 border-primary/20">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-success" />
        <h3 className="text-lg font-semibold">Value Breakdown</h3>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={waterfallData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis 
            dataKey="name" 
            stroke="hsl(var(--muted-foreground))"
            tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
            angle={-15}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            tick={{ fill: 'hsl(var(--foreground))' }}
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
            formatter={(value: number, name: string, props: any) => [
              `${value.toLocaleString()} ${metricLabel}`,
              props.payload.isPositive ? 'Increase' : 'Decrease'
            ]}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {waterfallData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.isPositive ? 'hsl(var(--success))' : 'hsl(var(--destructive))'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="flex items-center gap-2 text-sm">
          <TrendingUp className="w-4 h-4 text-success" />
          <span className="text-muted-foreground">Increases</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <TrendingDown className="w-4 h-4 text-destructive" />
          <span className="text-muted-foreground">Decreases</span>
        </div>
      </div>
    </Card>
  );
};
