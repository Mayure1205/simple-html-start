import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Log {
  timestamp: string;
  ip: string;
  type: string;
  payload: string;
  confidence: number;
  hash: string;
}

interface Props {
  feed: Log[];
}

export const LiveAttackFeed = ({ feed }: Props) => {
  return (
    <Card className="glass-card p-6 h-full">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        </span>
        Live Attack Feed
      </h3>
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-4">
          {feed.map((log, i) => (
            <div key={i} className="p-3 rounded-lg bg-muted/30 border border-border/50 text-sm">
              <div className="flex justify-between items-start mb-2">
                <span className="font-mono text-xs text-muted-foreground">{log.timestamp}</span>
                <Badge variant="outline" className="text-xs border-destructive text-destructive">
                  {log.type}
                </Badge>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-mono font-bold">{log.ip}</span>
                <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded">
                  {Math.round(log.confidence * 100)}% Conf.
                </span>
              </div>
              <code className="block bg-black/20 p-2 rounded text-xs font-mono text-muted-foreground break-all">
                {log.payload}
              </code>
              <div className="mt-2 text-[10px] text-muted-foreground font-mono">
                Hash: {log.hash}...
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};
