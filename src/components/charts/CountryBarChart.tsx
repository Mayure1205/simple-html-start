import { Card } from '@/components/ui/card';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface Props {
  data: Array<{ country: string; value: number }>;
  valueLabel: string;
}

export const CountryBarChart = ({ data, valueLabel }: Props) => {
  // Sort data by sales descending
  const sortedData = [...data].sort((a, b) => b.value - a.value);

  // Get Top 5 and Bottom 5
  const top5 = sortedData.slice(0, 5);
  const bottom5 = sortedData.slice(-5);

  // Combine for display (if total > 10, otherwise just show all sorted)
  const displayData = data.length > 10 ? [...top5, ...bottom5] : sortedData;

  return (
    <Card className="glass-card p-6 hover:glow-primary transition-all duration-300">
      <h3 className="text-lg font-semibold mb-4">Regional Performance (Top 5 & Bottom 5)</h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={displayData} layout="vertical" margin={{ left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis
            type="number"
            stroke="hsl(var(--muted-foreground))"
            tick={{ fill: 'hsl(var(--foreground))' }}
            tickFormatter={(value) => value.toLocaleString()}
          />
          <YAxis
            type="category"
            dataKey="country"
            stroke="hsl(var(--muted-foreground))"
            tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
            width={100}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
            formatter={(value: number) => [`${value.toLocaleString()} ${valueLabel}`, valueLabel]}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {displayData.map((entry, index) => {
              // Define a palette of colors for the bars
              const colors = [
                'hsl(var(--chart-1))', // Blue
                'hsl(var(--chart-2))', // Green
                'hsl(var(--chart-3))', // Yellow
                'hsl(var(--chart-4))', // Orange
                'hsl(var(--chart-5))', // Purple
              ];
              const colorIndex = index % colors.length;
              return (
                <Cell
                  key={`cell-${index}`}
                  fill={colors[colorIndex]}
                />
              );
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};
