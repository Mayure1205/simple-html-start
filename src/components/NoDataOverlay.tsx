import { AlertCircle } from 'lucide-react';

interface NoDataOverlayProps {
  message?: string;
}

export const NoDataOverlay = ({ message = "No data available for selected date range" }: NoDataOverlayProps) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10 rounded-lg">
      <div className="text-center space-y-3 p-6">
        <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground/50" />
        <div>
          <p className="text-sm font-medium text-muted-foreground">{message}</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Please adjust the date range to match your dataset
          </p>
        </div>
      </div>
    </div>
  );
};
