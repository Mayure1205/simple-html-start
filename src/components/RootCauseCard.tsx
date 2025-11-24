import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownRight, ArrowUpRight, Microscope, TrendingDown, TrendingUp } from "lucide-react";

interface RootCauseData {
  period: string;
  change_amount: number;
  change_percent: number;
  top_gainer?: { name: string; amount: number };
  top_loser?: { name: string; amount: number };
  top_country?: string;
  explanation: string;
}

interface RootCauseCardProps {
  data: RootCauseData;
}

export const RootCauseCard = ({ data }: RootCauseCardProps) => {
  const isPositive = data.change_amount > 0;

  return (
    <Card className="glass-card border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Microscope className="h-4 w-4 text-primary" />
          Root Cause Analysis
        </CardTitle>
        {isPositive ? (
          <TrendingUp className="h-4 w-4 text-green-500" />
        ) : (
          <TrendingDown className="h-4 w-4 text-red-500" />
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Main Stat */}
          <div>
            <div className="text-2xl font-bold flex items-center gap-2">
              {isPositive ? "+" : ""}
              {data.change_percent}%
              <span className={`text-xs font-normal px-2 py-1 rounded-full ${
                isPositive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
              }`}>
                {isPositive ? 'Growth' : 'Decline'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.period} ({Math.abs(data.change_amount).toLocaleString()} change)
            </p>
          </div>

          {/* Explanation Box */}
          <div className="bg-muted/50 p-3 rounded-md text-sm border border-border/50">
            <p className="leading-relaxed">
              <span className="font-semibold text-primary">AI Insight: </span>
              {data.explanation}
            </p>
          </div>

          {/* Drivers Grid (Only show if data exists) */}
          {(data.top_gainer || data.top_loser) && (
            <div className="grid grid-cols-2 gap-4 pt-2">
              {/* Top Gainer */}
              {data.top_gainer && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <ArrowUpRight className="h-3 w-3 text-green-500" /> Top Driver
                  </p>
                  <p className="text-sm font-medium truncate" title={data.top_gainer.name}>
                    {data.top_gainer.name}
                  </p>
                  <p className="text-xs text-green-500 font-mono">
                    +{data.top_gainer.amount.toLocaleString()}
                  </p>
                </div>
              )}

              {/* Top Loser */}
              {data.top_loser && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <ArrowDownRight className="h-3 w-3 text-red-500" /> Main Drag
                  </p>
                  <p className="text-sm font-medium truncate" title={data.top_loser.name}>
                    {data.top_loser.name}
                  </p>
                  <p className="text-xs text-red-500 font-mono">
                    {data.top_loser.amount.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
