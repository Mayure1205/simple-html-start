import { useEffect, useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export const DisclaimerPopup = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasSeenDisclaimer = localStorage.getItem('hasSeenDisclaimer');
    if (!hasSeenDisclaimer) {
      setIsVisible(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('hasSeenDisclaimer', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="glass-card max-w-lg w-full p-6 border-2 border-primary/20">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-2">Important Notice</h3>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                This is a demonstration dashboard for REDACT Suraksha 2k25 hackathon.
              </p>
              <p>
                <strong>Features:</strong>
              </p>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li>AI-powered sales forecasting using ML models</li>
                <li>RFM customer segmentation analysis</li>
                <li>Blockchain-based forecast verification (requires Ganache)</li>
                <li>Interactive data visualization</li>
              </ul>
              <p className="text-xs mt-3 text-muted-foreground/70">
                For demo purposes only. Blockchain features require Ganache CLI running on port 8545.
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0"
            onClick={handleClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <Button onClick={handleClose} className="w-full">
          Got it, proceed to dashboard
        </Button>
      </Card>
    </div>
  );
};
