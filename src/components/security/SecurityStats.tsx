import { Card } from '@/components/ui/card';
import { Activity, AlertTriangle, Lock, Shield } from 'lucide-react';

interface Props {
  data: {
    threat_level: string;
    active_threats: number;
    total_attacks_24h: number;
    confidence_stats: {
      avg: number;
      total_analyzed: number;
    };
  };
}

export const SecurityStats = ({ data }: Props) => {
  const getThreatColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'critical': return 'text-red-500';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-500';
      default: return 'text-green-500';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card className="glass-card p-4 flex items-center gap-4">
        <div className={`p-3 rounded-full bg-muted/50 ${getThreatColor(data.threat_level)}`}>
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Threat Level</p>
          <h3 className={`text-2xl font-bold ${getThreatColor(data.threat_level)}`}>
            {data.threat_level}
          </h3>
        </div>
      </Card>

      <Card className="glass-card p-4 flex items-center gap-4">
        <div className="p-3 rounded-full bg-muted/50 text-destructive">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Active Threats</p>
          <h3 className="text-2xl font-bold">{data.active_threats}</h3>
        </div>
      </Card>

      <Card className="glass-card p-4 flex items-center gap-4">
        <div className="p-3 rounded-full bg-muted/50 text-primary">
          <Activity className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Attacks (24h)</p>
          <h3 className="text-2xl font-bold">{data.total_attacks_24h.toLocaleString()}</h3>
        </div>
      </Card>

      <Card className="glass-card p-4 flex items-center gap-4">
        <div className="p-3 rounded-full bg-muted/50 text-accent">
          <Lock className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Avg Confidence</p>
          <h3 className="text-2xl font-bold">{(data.confidence_stats.avg * 100).toFixed(1)}%</h3>
        </div>
      </Card>
    </div>
  );
};
