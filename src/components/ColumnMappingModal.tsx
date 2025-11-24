import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";

export interface ColumnMapping {
  date: string;
  value: string;
  product?: string;
  region?: string;
  customer?: string;
}

interface ColumnMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  columns: string[];
  onConfirm: (mapping: ColumnMapping) => void;
  fileName: string;
}

export const ColumnMappingModal = ({
  isOpen,
  onClose,
  columns,
  onConfirm,
  fileName,
}: ColumnMappingModalProps) => {
  const [mapping, setMapping] = useState<ColumnMapping>({
    date: "",
    value: "",
  });

  const handleConfirm = () => {
    if (!mapping.date || !mapping.value) {
      toast.error("Please map at least the Date and Value columns.");
      return;
    }
    onConfirm(mapping);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Map Your Data Columns</DialogTitle>
          <DialogDescription>
            Tell us which columns in <strong>{fileName}</strong> correspond to our system fields.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Required Fields */}
          <div className="space-y-4 border-b pb-4">
            <h4 className="font-medium text-sm text-primary">Required Fields</h4>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">Date Column</Label>
              <Select onValueChange={(val) => setMapping({ ...mapping, date: val })}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select Date column" />
                </SelectTrigger>
                <SelectContent>
                  {columns.map((col) => (
                    <SelectItem key={col} value={col}>{col}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="value" className="text-right">Value/Sales</Label>
              <Select onValueChange={(val) => setMapping({ ...mapping, value: val })}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select Sales/Amount column" />
                </SelectTrigger>
                <SelectContent>
                  {columns.map((col) => (
                    <SelectItem key={col} value={col}>{col}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Optional Fields */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground">Optional Fields (Recommended)</h4>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="product" className="text-right">Product/Item</Label>
              <Select onValueChange={(val) => setMapping({ ...mapping, product: val })}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select Product column (Optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- None --</SelectItem>
                  {columns.map((col) => (
                    <SelectItem key={col} value={col}>{col}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="region" className="text-right">Region/Country</Label>
              <Select onValueChange={(val) => setMapping({ ...mapping, region: val })}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select Region column (Optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- None --</SelectItem>
                  {columns.map((col) => (
                    <SelectItem key={col} value={col}>{col}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="customer" className="text-right">Customer ID</Label>
              <Select onValueChange={(val) => setMapping({ ...mapping, customer: val })}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select Customer column (Optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- None --</SelectItem>
                  {columns.map((col) => (
                    <SelectItem key={col} value={col}>{col}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm}>Confirm Mapping</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
