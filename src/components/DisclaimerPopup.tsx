import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";

export const DisclaimerPopup = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if user has seen disclaimer
    const hasSeenDisclaimer = localStorage.getItem('myhack_disclaimer_seen');
    if (!hasSeenDisclaimer) {
      setIsOpen(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('myhack_disclaimer_seen', 'true');
    setIsOpen(false);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-xl">
            <AlertCircle className="h-6 w-6 text-yellow-500" />
            Important: Forecast Accuracy Disclaimer
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left space-y-4 text-base">
            <p className="font-semibold text-foreground">
              This platform uses Machine Learning to provide forecasts and predictions.
            </p>
            
            <div className="bg-yellow-50 dark:bg-yellow-950/20 border-l-4 border-yellow-500 p-4 rounded">
              <p className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                Please note:
              </p>
              <ul className="list-disc list-inside text-sm text-yellow-700 dark:text-yellow-300 space-y-2">
                <li><strong>Forecasts are estimates, not guarantees</strong></li>
                <li>Expected accuracy: <strong>70-85%</strong> (5-15% error is normal)</li>
                <li>Future events are unpredictable (trends, weather, competition)</li>
                <li>Data quality affects accuracy</li>
              </ul>
            </div>
            
            <div>
              <p className="font-semibold text-foreground mb-2">What we provide:</p>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Best possible estimates based on historical data</li>
                <li>Confidence intervals for all predictions</li>
                <li>Transparency about accuracy metrics</li>
                <li>Data-driven insights to improve decision-making</li>
              </ul>
            </div>
            
            <p className="text-xs text-muted-foreground italic bg-muted p-3 rounded">
              💡 Even Amazon, Walmart, and Google's ML models are not 100% accurate. 
              Use these forecasts as <strong>decision support tools</strong>, not absolute truth.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button onClick={handleAccept} className="w-full sm:w-auto">
            I Understand & Accept
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
