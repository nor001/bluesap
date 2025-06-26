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

interface AuditedFetchResponse<T = any> {
  data: T | null;
  error: string | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

export function useAuditedFetch<T = any>() {
  const auditedFetch = useCallback(async <T = any>(
    url: string, 
    options: AuditedFetchOptions
  ): Promise<T> => {
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
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      return data;
    } catch (error) {
      success = false;
      throw error;
    } finally {
      const duration = Date.now() - startTime;
      recordAPICompletion(url, method, duration, success);
    }
  }, []);

  return { auditedFetch };
}

/**
 * Hook for audited API calls with state management
 */
export function useAuditedAPI<T = any>() {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { auditedFetch } = useAuditedFetch<T>();

  const execute = useCallback(async (
    url: string,
    options: AuditedFetchOptions
  ): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await auditedFetch<T>(url, options);
      setData(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [auditedFetch]);

  const refetch = useCallback(async () => {
    // This would need the last URL and options to be stored
    // For now, it's a placeholder
  }, []);

  return {
    data,
    error,
    loading,
    execute,
    refetch
  };
}

/**
 * Utility function for audited fetch without hooks
 */
export async function auditedFetch<T = any>(
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
      throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    return data;
  } catch (error) {
    success = false;
    throw error;
  } finally {
    const duration = Date.now() - startTime;
    recordAPICompletion(url, method, duration, success);
  }
} 