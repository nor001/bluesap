/**
 * useAuditedFetch - Hook for API calls with performance auditing
 * Following user-rule principles: security-first, systematic handling, special case preservation
 */

import { useCallback, useState } from 'react';
import { auditAPICall, recordAPICall, recordAPICompletion } from '../performance-auditor';

interface AuditedFetchOptions extends RequestInit {
  component: string;
  skipAudit?: boolean;
}

interface UseAuditedFetchReturn {
  data: unknown | null;
  loading: boolean;
  error: string | null;
  execute: (url: string, options: AuditedFetchOptions) => Promise<void>;
  reset: () => void;
}

export function useAuditedFetch(): UseAuditedFetchReturn {
  const [data, setData] = useState<unknown | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (url: string, options: AuditedFetchOptions) => {
    setLoading(true);
    setError(null);

    try {
      const result = await auditedFetch(url, options);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset
  };
}

/**
 * Hook for audited API calls with state management
 */
export function useAuditedAPI<T = unknown>() {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { execute } = useAuditedFetch();

  const executeAPI = useCallback(async (
    url: string,
    options: AuditedFetchOptions
  ): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      await execute(url, options);
      // Note: This is a simplified version - in practice you'd want to get the result
      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [execute]);

  const refetch = useCallback(async () => {
    // This would need the last URL and options to be stored
    // For now, it's a placeholder
  }, []);

  return {
    data,
    error,
    loading,
    execute: executeAPI,
    refetch
  };
}

/**
 * Utility function for audited fetch without hooks
 */
export async function auditedFetch<T = unknown>(
  url: string,
  options: AuditedFetchOptions
): Promise<T> {
  const { component, skipAudit = false, ...fetchOptions } = options;
  const method = fetchOptions.method || 'GET';
  
  // Audit the API call
  if (!skipAudit && !auditAPICall(url, method, component)) {
    throw new Error(`API call blocked by performance auditor: ${method} ${url}`);
  }

  // Record the call
  recordAPICall(url, method, component, fetchOptions.body);

  const startTime = Date.now();
  let success = false;

  try {
    const response = await fetch(url, fetchOptions);
    const data = await response.json();
    
    success = response.ok;
    
    if (!response.ok) {
      throw new Error((data as { error?: string }).error || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    return data as T;
  } catch (error) {
    success = false;
    throw error;
  } finally {
    const duration = Date.now() - startTime;
    recordAPICompletion(url, method, duration, success);
  }
} 