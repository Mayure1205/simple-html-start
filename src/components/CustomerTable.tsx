import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface Customer {
  id: string;
  monetary: number;
  segment: string;
  offer: string;
}

interface Props {
  customers: Customer[];
}

const getSegmentColor = (segment: string) => {
  const colors: Record<string, string> = {
    'Champions': 'bg-blue-600 text-white',
    'Loyal Customers': 'bg-purple-600 text-white',
    'Potential Loyalists': 'bg-green-600 text-white',
    'At Risk': 'bg-red-600 text-white',
    'Lost': 'bg-gray-600 text-white',
    'Standard': 'bg-gray-500 text-white',
    // Fallback for old segment names
    'VIP': 'bg-blue-600 text-white',
    'Loyal': 'bg-purple-600 text-white',
    'At-Risk': 'bg-red-600 text-white',
    'Normal': 'bg-gray-500 text-white',
  };
  return colors[segment] || 'bg-muted';
};

const getOfferStyle = (offer: string) => {
  if (offer.includes('VIP') || offer.includes('15%')) {
    return 'text-gold font-bold';
  }
  if (offer.includes('Win-Back') || offer.includes('20%')) {
    return 'text-at-risk-red font-bold';
  }
  if (offer.includes('Early Access')) {
    return 'text-loyal-purple font-bold';
  }
  return 'text-muted-foreground font-semibold';
};

export const CustomerTable = ({ customers }: Props) => {
  return (
    <Card className="glass-card p-6 hover:glow-primary transition-all duration-300">
      <h3 className="text-lg font-semibold mb-4">Top 10 High-Value Customers</h3>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/50">
              <TableHead>Customer ID</TableHead>
              <TableHead>Monetary Value</TableHead>
              <TableHead>Segment</TableHead>
              <TableHead>Suggested Offer</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer.id} className="border-border/50 hover:bg-muted/30">
                <TableCell className="font-mono font-medium">{customer.id}</TableCell>
                <TableCell className="font-bold text-lg">£{customer.monetary.toLocaleString()}</TableCell>
                <TableCell>
                  <Badge className={getSegmentColor(customer.segment)}>
                    {customer.segment}
                  </Badge>
                </TableCell>
                <TableCell className={getOfferStyle(customer.offer)}>{customer.offer}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};
