export const reconcileData = async (): Promise<{
  total: number;
  match: boolean;
  difference: number;
}> => {
  try {
    const response = await fetch('/api/reconcile');
    const result = await response.json();

    if (result.success) {
      return {
        total: result.actual_total,
        match: result.match,
        difference: result.difference,
      };
    } else {
      throw new Error(result.error || 'Reconciliation failed');
    }
  } catch (error) {
    console.error('Reconciliation error:', error);
    throw error;
  }
};
