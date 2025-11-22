import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card } from '@/components/ui/card';

interface Props {
  data: Array<{ product: string; quantity: number }>;
}

export const ProductBarChart = ({ data }: Props) => {
  // Sort data by quantity descending
  const sortedData = [...data].sort((a, b) => b.quantity - a.quantity);

  // Get Top 10 and Bottom 10
  const top10 = sortedData.slice(0, 10);
  const bottom10 = sortedData.slice(-10);

  // Combine for display (if total > 20, otherwise just show all sorted)
  const displayData = data.length > 20 ? [...top10, ...bottom10] : sortedData;

  return (
    <Card className="glass-card p-6 hover:glow-primary transition-all duration-300">
      <h3 className="text-lg font-semibold mb-4">Product Performance (Top 10 & Bottom 10)</h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={displayData} margin={{ bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis
            dataKey="product"
            stroke="hsl(var(--muted-foreground))"
            tick={{ fill: 'hsl(var(--foreground))', fontSize: 10 }}
            angle={-45}
            textAnchor="end"
            interval={0}
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
            formatter={(value: number) => [`${value.toLocaleString()} units`, 'Quantity']}
          />
          <Bar dataKey="quantity" radius={[4, 4, 0, 0]}>
            {displayData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={index < 10 ? 'hsl(var(--chart-3))' : 'hsl(var(--destructive))'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};
