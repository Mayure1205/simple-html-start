import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertCircle, CheckCircle2, FileText, Upload, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface CSVUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (
    dateRange?: { from: string; to: string }, 
    columns?: string[], 
    filename?: string,
    suggested_mapping?: any,
    confidence?: string
  ) => void;
  currentFile: string;
  isDefault: boolean;
}

export const CSVUploadModal = ({ isOpen, onClose, onUploadSuccess, currentFile, isDefault }: CSVUploadModalProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      toast.error('Invalid file type. Please select a CSV file.');
      return;
    }

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error('File too large. Maximum size is 10MB.');
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/upload-csv', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        // ✅ AUTO-DETECTION SUCCESS
        if (data.auto_detected && !data.requires_mapping) {
          toast.success(data.message || 'File uploaded and fields auto-detected!');
          if (data.warnings && data.warnings.length > 0) {
            data.warnings.forEach((w: string) => toast.warning(w));
          }
          setSelectedFile(null);
          // No mapping needed - directly reload dashboard
          onUploadSuccess(data.date_range, undefined, data.filename);
          onClose();
        }
        // ⚠️ NEEDS USER CONFIRMATION
        else if (data.requires_mapping) {
          toast.info(data.message || 'Please confirm field mapping');
          setSelectedFile(null);
          // Pass suggested mapping to parent for confirmation
          onUploadSuccess(
            data.date_range, 
            data.columns || [], 
            data.filename,
            data.suggested_mapping,
            data.confidence
          );
          onClose();
        }
      } else {
        toast.error(data.error || 'Upload failed');
      }
    } catch (error) {
      toast.error('Upload failed. Please try again.');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    if (isDefault) {
      toast.error('Cannot remove default dataset');
      return;
    }

    setIsRemoving(true);
    try {
      const response = await fetch('/api/remove-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: currentFile }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Reverted to default dataset');
        setSelectedFile(null);
        onUploadSuccess();
        onClose();
      } else {
        toast.error(data.error || 'Failed to remove file');
      }
    } catch (error) {
      toast.error('Failed to remove file');
      console.error('Remove error:', error);
    } finally {
      setIsRemoving(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Dataset Manager
          </DialogTitle>
          <DialogDescription>
            Upload your own retail CSV or manage the current dataset
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current File Display */}
          <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/10">
            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Currently Viewing:</p>
              <p className="text-xs text-muted-foreground truncate">{currentFile}</p>
            </div>
            {!isDefault && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleRemove}
                disabled={isRemoving}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
              >
                {isRemoving ? 'Removing...' : 'Revert'}
              </Button>
            )}
          </div>

          {/* Upload Section */}
          {!selectedFile ? (
            <div className="border-2 border-dashed border-primary/20 rounded-lg p-8 text-center hover:border-primary/40 transition-colors">
              <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium mb-2">Upload Custom CSV</p>
              <p className="text-xs text-muted-foreground mb-4">
                Max 10MB • Required: InvoiceNo, CustomerID, InvoiceDate, Quantity, Price
              </p>
              <label htmlFor="csv-upload-modal">
                <Button variant="outline" size="sm" asChild>
                  <span className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    Choose File
                  </span>
                </Button>
              </label>
              <input
                id="csv-upload-modal"
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div className="border border-primary/20 rounded-lg p-4 bg-primary/5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancel}
                  className="h-8 w-8 p-0 flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="flex-1"
                  size="sm"
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Visualize It
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  size="sm"
                  disabled={isUploading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="flex items-start gap-2 p-3 bg-blue-500/5 rounded-lg border border-blue-500/10">
            <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-1">CSV Requirements:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Minimum 100 transactions spanning 30+ days</li>
                <li>Date format: YYYY-MM-DD or YYYY-MM-DD HH:MM:SS</li>
              </ul>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
