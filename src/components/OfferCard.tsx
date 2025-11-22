import { Card } from '@/components/ui/card';
import { Gift, Sparkles } from 'lucide-react';

interface Props {
    segment: string;
    offer: string;
    description: string;
}

export const OfferCard = ({ segment, offer, description }: Props) => {
    return (
        <Card className="glass-card p-6 relative overflow-hidden group hover:glow-primary transition-all duration-300">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Gift size={100} />
            </div>

            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2 text-primary">
                    <Sparkles className="w-5 h-5" />
                    <span className="font-semibold tracking-wider text-sm uppercase">AI Suggested Action</span>
                </div>

                <h3 className="text-2xl font-bold mb-1">{offer}</h3>
                <p className="text-muted-foreground mb-4">Target: <span className="text-foreground font-medium">{segment}</span> Segment</p>

                <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                    <p className="text-sm">{description}</p>
                </div>
            </div>
        </Card>
    );
};
