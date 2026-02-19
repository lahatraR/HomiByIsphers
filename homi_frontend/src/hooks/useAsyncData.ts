import { useState, useEffect, useCallback, useRef } from 'react';

// ─── useAsyncData ──────────────────────────────────────────────────
// Generic data-fetching hook that eliminates the repeated pattern of:
//   const [data, setData] = useState(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState(null);
//   useEffect(() => { loadData(); }, []);
//
// Usage:
//   const { data, isLoading, error, refetch } = useAsyncData(
//     () => budgetService.getOverview(),
//     { immediate: true }
//   );
//
//   const { data: invoices, isLoading } = useAsyncData(
//     () => getInvoices(status),
//     { deps: [status] }
//   );

interface UseAsyncDataOptions<T> {
  /** Start fetching immediately on mount (default: true) */
  immediate?: boolean;
  /** Default value before first load */
  initialData?: T;
  /** Dependencies that trigger a refetch (like useEffect deps) */
  deps?: any[];
  /** Called on successful fetch */
  onSuccess?: (data: T) => void;
  /** Called on error */
  onError?: (error: Error) => void;
}

interface UseAsyncDataReturn<T> {
  data: T | undefined;
  isLoading: boolean;
  error: string | null;
  /** Re-run the fetch function */
  refetch: () => Promise<void>;
  /** Manually set data (for optimistic updates) */
  setData: React.Dispatch<React.SetStateAction<T | undefined>>;
}

export function useAsyncData<T>(
  fetchFn: () => Promise<T>,
  options: UseAsyncDataOptions<T> = {}
): UseAsyncDataReturn<T> {
  const {
    immediate = true,
    initialData,
    deps = [],
    onSuccess,
    onError,
  } = options;

  const [data, setData] = useState<T | undefined>(initialData);
  const [isLoading, setIsLoading] = useState(immediate);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const execute = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      if (mountedRef.current) {
        setData(result);
        onSuccess?.(result);
      }
    } catch (err: any) {
      if (mountedRef.current) {
        const msg = err?.response?.data?.error || err?.message || 'Une erreur est survenue';
        setError(msg);
        onError?.(err);
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [fetchFn]);

  useEffect(() => {
    mountedRef.current = true;
    if (immediate) {
      execute();
    }
    return () => {
      mountedRef.current = false;
    };
  }, deps);

  return { data, isLoading, error, refetch: execute, setData };
}
