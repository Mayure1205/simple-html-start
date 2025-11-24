import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, XCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  displayedTotal: number;
  onReconcile: () => Promise<{ total: number; match: boolean; difference: number }>;
}

export const ReconciliationCheck = ({ displayedTotal, onReconcile }: Props) => {
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<{
    checked: boolean;
    match: boolean;
    actualTotal: number;
    difference: number;
  } | null>(null);

  const handleCheck = async () => {
    setIsChecking(true);
    try {
      const reconcileResult = await onReconcile();
      
      setResult({
        checked: true,
        match: reconcileResult.match,
        actualTotal: reconcileResult.total,
        difference: reconcileResult.difference,
      });

      if (reconcileResult.match) {
        toast.success('✓ Data reconciliation passed!');
      } else {
        toast.warning('⚠ Data mismatch detected', {
          description: `Difference: ${reconcileResult.difference.toLocaleString()}`,
        });
      }
    } catch (error) {
      toast.error('Failed to reconcile data');
      console.error('Reconciliation error:', error);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <Card className="glass-card p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
            {result?.checked ? (
              result.match ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
              )
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Data Reconciliation
          </h3>
          {result?.checked ? (
            <div className="text-xs space-y-1">
              <p className="text-muted-foreground">
                Displayed: <span className="font-mono">{displayedTotal.toLocaleString()}</span>
              </p>
              <p className="text-muted-foreground">
                Actual: <span className="font-mono">{result.actualTotal.toLocaleString()}</span>
              </p>
              {!result.match && (
                <p className="text-yellow-600 font-medium">
                  Difference: {Math.abs(result.difference).toLocaleString()}
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Verify totals match raw data
            </p>
          )}
        </div>

        <Button
          variant={result?.checked ? (result.match ? 'outline' : 'destructive') : 'default'}
          size="sm"
          onClick={handleCheck}
          disabled={isChecking}
          className="gap-2"
        >
          {isChecking ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Checking...
            </>
          ) : result?.checked ? (
            result.match ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Verified
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4" />
                Mismatch
              </>
            )
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Check Now
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};
