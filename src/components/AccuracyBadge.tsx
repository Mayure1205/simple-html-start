import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

interface AccuracyMetrics {
  accuracy: number;
  mape: number;
  rmse: number;
  r2: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';
}

interface Props {
  metrics: AccuracyMetrics;
}

export const AccuracyBadge = ({ metrics }: Props) => {
  const getConfidenceColor = () => {
    switch (metrics.confidence) {
      case 'HIGH': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'MEDIUM': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'LOW': return 'bg-red-500/10 text-red-600 border-red-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getIcon = () => {
    switch (metrics.confidence) {
      case 'HIGH': return <CheckCircle className="w-5 h-5" />;
      case 'MEDIUM': return <TrendingUp className="w-5 h-5" />;
      case 'LOW': return <AlertCircle className="w-5 h-5" />;
      default: return <TrendingUp className="w-5 h-5" />;
    }
  };

  return (
    <Card className="glass-card p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold mb-1">Model Accuracy</h3>
          <Badge className={getConfidenceColor()}>
            {metrics.confidence} Confidence
          </Badge>
        </div>
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          {getIcon()}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Accuracy</p>
          <p className="font-semibold">{(metrics.accuracy * 100).toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-muted-foreground">MAPE</p>
          <p className="font-semibold">{metrics.mape.toFixed(2)}%</p>
        </div>
        <div>
          <p className="text-muted-foreground">RMSE</p>
          <p className="font-semibold">{metrics.rmse.toFixed(0)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">R²</p>
          <p className="font-semibold">{metrics.r2.toFixed(3)}</p>
        </div>
      </div>
    </Card>
  );
};
