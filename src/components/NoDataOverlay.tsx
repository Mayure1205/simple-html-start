import { AlertCircle, Upload } from 'lucide-react';
import { Button } from './ui/button';

interface NoDataOverlayProps {
  message?: string;
  showUploadButton?: boolean;
  onUploadClick?: () => void;
}

export const NoDataOverlay = ({ 
  message = "No data available for selected date range",
  showUploadButton = false,
  onUploadClick
}: NoDataOverlayProps) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10 rounded-lg">
      <div className="text-center space-y-4 p-6">
        {showUploadButton ? (
          <Upload className="h-12 w-12 mx-auto text-primary/50" />
        ) : (
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground/50" />
        )}
        <div>
          <p className="text-sm font-medium text-muted-foreground">{message}</p>
          {!showUploadButton && (
            <p className="text-xs text-muted-foreground/70 mt-1">
              Please adjust the date range to match your dataset
            </p>
          )}
        </div>
        {showUploadButton && onUploadClick && (
          <Button onClick={onUploadClick} className="gap-2">
            <Upload className="h-4 w-4" />
            Upload CSV File
          </Button>
        )}
      </div>
    </div>
  );
};
