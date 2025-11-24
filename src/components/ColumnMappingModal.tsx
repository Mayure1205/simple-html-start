import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export interface ColumnMapping {
  date_col?: string;
  value_col?: string;
  product_col?: string;
  region_col?: string;
  customer_col?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  columns: string[];
  fileName: string;
  onConfirm: (mapping: ColumnMapping) => void;
}

export const ColumnMappingModal = ({ isOpen, onClose, columns, fileName, onConfirm }: Props) => {
  const [mapping, setMapping] = useState<ColumnMapping>({});

  const handleConfirm = () => {
    onConfirm(mapping);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Map CSV Columns</DialogTitle>
          <DialogDescription>
            Please map the columns from <strong>{fileName}</strong> to the required fields
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Date Column *</Label>
            <Select value={mapping.date_col} onValueChange={(val) => setMapping({ ...mapping, date_col: val })}>
              <SelectTrigger>
                <SelectValue placeholder="Select date column" />
              </SelectTrigger>
              <SelectContent>
                {columns.map((col) => (
                  <SelectItem key={col} value={col}>{col}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Value Column *</Label>
            <Select value={mapping.value_col} onValueChange={(val) => setMapping({ ...mapping, value_col: val })}>
              <SelectTrigger>
                <SelectValue placeholder="Select value column" />
              </SelectTrigger>
              <SelectContent>
                {columns.map((col) => (
                  <SelectItem key={col} value={col}>{col}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Product Column (Optional)</Label>
            <Select value={mapping.product_col} onValueChange={(val) => setMapping({ ...mapping, product_col: val })}>
              <SelectTrigger>
                <SelectValue placeholder="Select product column" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {columns.map((col) => (
                  <SelectItem key={col} value={col}>{col}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Region Column (Optional)</Label>
            <Select value={mapping.region_col} onValueChange={(val) => setMapping({ ...mapping, region_col: val })}>
              <SelectTrigger>
                <SelectValue placeholder="Select region column" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {columns.map((col) => (
                  <SelectItem key={col} value={col}>{col}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Customer ID Column (Optional)</Label>
            <Select value={mapping.customer_col} onValueChange={(val) => setMapping({ ...mapping, customer_col: val })}>
              <SelectTrigger>
                <SelectValue placeholder="Select customer column" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {columns.map((col) => (
                  <SelectItem key={col} value={col}>{col}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm} 
              disabled={!mapping.date_col || !mapping.value_col}
              className="flex-1"
            >
              Confirm Mapping
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
