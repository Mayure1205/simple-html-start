import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  title: string;
  hash: string;
  link?: string;
  verified?: boolean;
}

export const HashCard = ({ title, hash, link, verified }: Props) => {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(hash);
    toast.success('Hash copied to clipboard!');
  };

  return (
    <Card className="glass-card p-6 hover:glow-primary transition-all duration-300">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        {verified && (
          <div className="flex items-center gap-1 text-xs text-success">
            <CheckCircle2 className="w-4 h-4" />
            <span>Verified on Ganache</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <code className="flex-1 text-xs bg-background/50 p-3 rounded-lg overflow-x-auto font-mono">
          {hash}
        </code>
        <Button
          variant="outline"
          size="icon"
          onClick={copyToClipboard}
          className="shrink-0"
        >
          <Copy className="w-4 h-4" />
        </Button>
        {link && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => window.open(link, '_blank')}
            className="shrink-0"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        )}
      </div>
    </Card>
  );
};
