import { useState } from 'react';
import { Upload, X, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface Props {
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

export const CSVUploadModal = ({ isOpen, onClose, onUploadSuccess, currentFile, isDefault }: Props) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a CSV file');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload-csv', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        toast.success('CSV uploaded successfully!');
        onUploadSuccess(
          result.date_range,
          result.unmapped_columns,
          result.filename,
          result.suggested_mapping,
          result.confidence
        );
        onClose();
        setFile(null);
      } else {
        toast.error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload CSV file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = async () => {
    try {
      const response = await fetch('/api/reset-file', { method: 'POST' });
      const result = await response.json();
      
      if (result.success) {
        toast.success('Reset to default dataset');
        onUploadSuccess();
        onClose();
      }
    } catch (error) {
      toast.error('Failed to reset dataset');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Custom Dataset</DialogTitle>
          <DialogDescription>
            Upload your CSV file to analyze custom sales data
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current File Info */}
          <div className="p-3 rounded-lg bg-muted/50 border">
            <p className="text-xs text-muted-foreground mb-1">Currently Loaded:</p>
            <p className="text-sm font-medium">{currentFile}</p>
            {!isDefault && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="mt-2 text-xs"
              >
                Reset to Default
              </Button>
            )}
          </div>

          {/* File Upload Area */}
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            {file ? (
              <div className="space-y-2">
                <FileText className="w-8 h-8 mx-auto text-primary" />
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFile(null)}
                >
                  <X className="w-4 h-4 mr-1" />
                  Remove
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Drop CSV file here or click to browse
                </p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="csv-upload"
                />
                <label htmlFor="csv-upload">
                  <Button variant="outline" size="sm" asChild>
                    <span>Select File</span>
                  </Button>
                </label>
              </div>
            )}
          </div>

          {/* Requirements */}
          <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
            <div className="flex gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground">
                <p className="font-medium mb-1">Required Columns:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Date (InvoiceDate, Date, etc.)</li>
                  <li>Value (Quantity, Amount, Sales, etc.)</li>
                  <li>Optional: Product, Country/Region, CustomerID</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="flex-1"
            >
              {isUploading ? 'Uploading...' : 'Upload & Analyze'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
