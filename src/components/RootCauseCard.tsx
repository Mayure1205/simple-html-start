import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

interface RootCauseData {
  period: string;
  change_amount: number;
  change_percent: number;
  top_gainer?: { name: string; amount: number };
  top_loser?: { name: string; amount: number };
  top_country?: string;
  explanation: string;
}

interface Props {
  data: RootCauseData;
}

export const RootCauseCard = ({ data }: Props) => {
  const isPositive = data.change_amount > 0;

  return (
    <Card className="glass-card p-6 border-l-4 border-l-primary">
      <div className="flex items-start gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          isPositive ? 'bg-green-500/10' : 'bg-red-500/10'
        }`}>
          {isPositive ? (
            <TrendingUp className="w-5 h-5 text-green-600" />
          ) : (
            <TrendingDown className="w-5 h-5 text-red-600" />
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Root Cause Analysis
          </h3>
          <p className="text-xs text-muted-foreground">{data.period}</p>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? '+' : ''}{data.change_percent.toFixed(1)}%
          </p>
          <p className="text-xs text-muted-foreground">
            {isPositive ? '+' : ''}{data.change_amount.toLocaleString()}
          </p>
        </div>
      </div>
      
      <p className="text-sm mb-4">{data.explanation}</p>
      
      <div className="grid grid-cols-2 gap-4 text-xs">
        {data.top_gainer && (
          <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
            <p className="text-muted-foreground mb-1">Top Gainer</p>
            <p className="font-semibold">{data.top_gainer.name}</p>
            <p className="text-green-600">+{data.top_gainer.amount.toLocaleString()}</p>
          </div>
        )}
        {data.top_loser && (
          <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
            <p className="text-muted-foreground mb-1">Top Loser</p>
            <p className="font-semibold">{data.top_loser.name}</p>
            <p className="text-red-600">{data.top_loser.amount.toLocaleString()}</p>
          </div>
        )}
      </div>
    </Card>
  );
};
