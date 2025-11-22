import { Card } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface Props {
  title: string;
  value: string | number;
  icon: LucideIcon;
  gradient?: string;
}

export const MetricCard = ({ title, value, icon: Icon, gradient }: Props) => {
  return (
    <Card className={`glass-card p-8 glow-primary hover:scale-[1.02] transition-all duration-300 ${gradient || ''}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-3">{title}</p>
          <p className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {value}
          </p>
        </div>
        <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-lg">
          <Icon className="w-8 h-8 text-white" />
        </div>
      </div>
    </Card>
  );
};
