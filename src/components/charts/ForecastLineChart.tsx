import { Card } from '@/components/ui/card';
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';

interface DataPoint {
  week: string;
  historical?: number;
  forecast?: number;
  lower?: number;
  upper?: number;
  isAnomaly?: boolean;
}

interface Props {
  historical: Array<{ week: string; sales: number }>;
  forecast: Array<{ week: string; sales: number; lower: number; upper: number }>;
  metricLabel: string;
  horizon: number;
}

export const ForecastLineChart = ({ historical, forecast, metricLabel, horizon }: Props) => {
  // Detect anomalies (spikes/drops > 30% from average)
  const historicalAvg = historical.length > 0
    ? historical.reduce((sum, d) => sum + d.sales, 0) / historical.length
    : 0;

  const historicalWithAnomalies = historical.map((d) => {
    const deviation = Math.abs((d.sales - historicalAvg) / historicalAvg);
    return {
      ...d,
      isAnomaly: deviation > 0.3,
    };
  });

  const combinedData: DataPoint[] = [
    ...historicalWithAnomalies.map(d => ({ 
      week: d.week, 
      historical: d.sales,
      isAnomaly: d.isAnomaly 
    })),
    ...forecast.map(d => ({
      week: d.week,
      forecast: d.sales,
      lower: d.lower,
      upper: d.upper,
    })),
  ];

  return (
    <Card className="glass-card p-6 glow-primary border-2 border-primary/20">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        AI Forecast - Next {horizon} Weeks
        <span className="text-xs bg-accent/10 text-accent px-2 py-1 rounded-full">AI Powered</span>
      </h3>
      <ResponsiveContainer width="100%" height={350}>
        <ComposedChart data={combinedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis 
            dataKey="week" 
            stroke="hsl(var(--muted-foreground))"
            tick={{ fill: 'hsl(var(--foreground))' }}
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
            formatter={(value: number) => [`${value.toLocaleString()} ${metricLabel}`, metricLabel]}
          />
          <Legend />
          
          <Area
            type="monotone"
            dataKey="upper"
            stroke="none"
            fill="hsl(var(--primary))"
            fillOpacity={0.1}
            name="95% Confidence"
          />
          <Area
            type="monotone"
            dataKey="lower"
            stroke="none"
            fill="hsl(var(--background))"
            fillOpacity={1}
          />
          
          <Line
            type="monotone"
            dataKey="historical"
            stroke="hsl(var(--chart-1))"
            strokeWidth={3}
            dot={(props: any) => {
              const { cx, cy, payload } = props;
              if (payload.isAnomaly) {
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={6}
                    fill="hsl(var(--destructive))"
                    stroke="white"
                    strokeWidth={2}
                  />
                );
              }
              return <circle cx={cx} cy={cy} r={4} fill="hsl(var(--chart-1))" />;
            }}
            name="Historical"
          />
          <Line
            type="monotone"
            dataKey="forecast"
            stroke="hsl(var(--primary))"
            strokeWidth={3}
            strokeDasharray="5 5"
            dot={{ fill: 'hsl(var(--primary))', r: 4 }}
            name="AI Forecast"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </Card>
  );
};
