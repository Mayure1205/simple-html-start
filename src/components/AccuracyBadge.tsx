import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, HelpCircle, XCircle } from "lucide-react";

interface AccuracyMetrics {
  accuracy: number;
  mape: number;
  rmse: number;
  r2: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';
}

interface AccuracyBadgeProps {
  metrics: AccuracyMetrics;
  compact?: boolean;
}

export const AccuracyBadge = ({ metrics, compact = false }: AccuracyBadgeProps) => {
  const getConfidenceColor = () => {
    if (metrics.confidence === 'HIGH') return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800';
    if (metrics.confidence === 'MEDIUM') return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800';
    if (metrics.confidence === 'LOW') return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800';
    return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-950/20 border-gray-200 dark:border-gray-800';
  };

  const getConfidenceIcon = () => {
    if (metrics.confidence === 'HIGH') return <CheckCircle2 className="h-4 w-4" />;
    if (metrics.confidence === 'MEDIUM') return <AlertCircle className="h-4 w-4" />;
    if (metrics.confidence === 'LOW') return <XCircle className="h-4 w-4" />;
    return <HelpCircle className="h-4 w-4" />;
  };

  if (compact) {
    return (
      <Badge variant="outline" className={`gap-1 ${getConfidenceColor()}`}>
        {getConfidenceIcon()}
        {metrics.accuracy}% Accurate
      </Badge>
    );
  }

  return (
    <Card className="p-4 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-xl border-primary/20">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Forecast Accuracy</h3>
          <Badge variant="outline" className={`gap-1 ${getConfidenceColor()}`}>
            {getConfidenceIcon()}
            {metrics.confidence}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">{metrics.accuracy}%</span>
            <span className="text-xs text-muted-foreground">Accuracy</span>
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center p-2 bg-muted rounded">
              <div className="font-semibold">{metrics.mape}%</div>
              <div className="text-muted-foreground">MAPE</div>
            </div>
            <div className="text-center p-2 bg-muted rounded">
              <div className="font-semibold">{metrics.rmse.toFixed(0)}</div>
              <div className="text-muted-foreground">RMSE</div>
            </div>
            <div className="text-center p-2 bg-muted rounded">
              <div className="font-semibold">{metrics.r2}</div>
              <div className="text-muted-foreground">R²</div>
            </div>
          </div>
        </div>
        
        <p className="text-xs text-muted-foreground">
          Based on train/test split validation. 5-15% error is normal in ML forecasting.
        </p>
      </div>
    </Card>
  );
};
