import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, Sector } from 'recharts';
import { Card } from '@/components/ui/card';
import { useState } from 'react';

interface Props {
  data: Array<{ segment: string; count: number; color: string }>;
}

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;

  return (
    <g>
      <text x={cx} y={cy} dy={-10} textAnchor="middle" fill={fill} className="text-lg font-bold">
        {payload.segment}
      </text>
      <text x={cx} y={cy} dy={15} textAnchor="middle" fill="#999" className="text-sm">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 10}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 12}
        outerRadius={outerRadius + 15}
        fill={fill}
      />
    </g>
  );
};

export const RFMDonutChart = ({ data }: Props) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  // Map segments to colors (backend returns: Champions, Loyal Customers, Potential Loyalists, At Risk, Lost, Standard)
  const chartData = data.map(item => {
    const segmentColorMap: Record<string, string> = {
      'Champions': 'hsl(var(--chart-1))',
      'Loyal Customers': 'hsl(var(--chart-2))',
      'Potential Loyalists': 'hsl(var(--chart-5))',
      'At Risk': 'hsl(var(--chart-4))',
      'Lost': 'hsl(var(--chart-3))',
      'Standard': 'hsl(var(--chart-3))',
      // Fallback for old segment names
      'VIP': 'hsl(var(--chart-1))',
      'Loyal': 'hsl(var(--chart-2))',
      'At-Risk': 'hsl(var(--chart-4))',
      'Normal': 'hsl(var(--chart-3))',
    };

    return {
      segment: item.segment,
      count: item.count,
      color: segmentColorMap[item.segment] || item.color || 'hsl(var(--chart-3))',
    };
  });

  return (
    <Card className="glass-card p-6 hover:glow-primary transition-all duration-300">
      <h3 className="text-lg font-semibold mb-4">Customer Segments (RFM Analysis)</h3>
      <ResponsiveContainer width="100%" height={350}>
        <PieChart>
          <Pie
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={80}
            outerRadius={110}
            dataKey="count"
            onMouseEnter={onPieEnter}
            paddingAngle={2}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0.1)" strokeWidth={1} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
            formatter={(value: number) => [`${value.toLocaleString()} customers`, 'Count']}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
          />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
};
