import { Card } from '@/components/ui/card';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface Props {
  data: Array<{
    time: string;
    SQLi: number;
    XSS: number;
    Benign: number;
  }>;
}

export const AttackTrendChart = ({ data }: Props) => {
  return (
    <Card className="glass-card p-6">
      <h3 className="text-lg font-semibold mb-4">Attack Trends (Last 24h)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis 
            dataKey="time" 
            stroke="hsl(var(--muted-foreground))"
            tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
            interval={3}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            tick={{ fill: 'hsl(var(--foreground))' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Line type="monotone" dataKey="SQLi" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="XSS" stroke="hsl(var(--chart-4))" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="Benign" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};
