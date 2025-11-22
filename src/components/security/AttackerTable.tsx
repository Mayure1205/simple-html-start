import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Props {
  data: Array<{
    ip: string;
    attacks: number;
    total_requests: number;
  }>;
}

export const AttackerTable = ({ data }: Props) => {
  return (
    <Card className="glass-card p-6">
      <h3 className="text-lg font-semibold mb-4">Top Attacking IPs</h3>
      <div className="overflow-auto max-h-[300px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>IP Address</TableHead>
              <TableHead>Attacks</TableHead>
              <TableHead>Total Req</TableHead>
              <TableHead>Risk</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, i) => (
              <TableRow key={i}>
                <TableCell className="font-mono">{row.ip}</TableCell>
                <TableCell className="text-destructive font-bold">{row.attacks}</TableCell>
                <TableCell>{row.total_requests}</TableCell>
                <TableCell>
                  <Badge variant={row.attacks > 100 ? "destructive" : "outline"}>
                    {row.attacks > 100 ? "High" : "Medium"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};
