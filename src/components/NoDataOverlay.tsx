import { Database, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  message?: string;
  showUploadButton?: boolean;
  onUploadClick?: () => void;
}

export const NoDataOverlay = ({ 
  message = "No data available for this view", 
  showUploadButton = false,
  onUploadClick 
}: Props) => {
  return (
    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
      <div className="text-center p-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          {showUploadButton ? (
            <Database className="w-8 h-8 text-muted-foreground" />
          ) : (
            <AlertCircle className="w-8 h-8 text-muted-foreground" />
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-4">{message}</p>
        {showUploadButton && onUploadClick && (
          <Button onClick={onUploadClick} variant="outline" size="sm" className="gap-2">
            <Database className="w-4 h-4" />
            Upload Dataset
          </Button>
        )}
      </div>
    </div>
  );
};
