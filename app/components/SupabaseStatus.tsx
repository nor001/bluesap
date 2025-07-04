'use client';
import { isSupabaseAvailable, supabaseClient } from '@/lib/supabase-client';
import { useEffect, useState } from 'react';
import { ERROR_MESSAGES } from '../lib/types/error-messages';

export function SupabaseStatus() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error'>(
    'checking'
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkConnection() {
      if (!isSupabaseAvailable()) {
        setStatus('error');
        setError(ERROR_MESSAGES.CONFIG_ERROR);
        return;
      }

      try {
        const { error } = await supabaseClient!.auth.getSession();

        if (error) {
          setStatus('error');
          setError(error.message);
        } else {
          setStatus('connected');
          setError(null);
        }
      } catch (err) {
        setStatus('error');
        setError(err instanceof Error ? err.message : ERROR_MESSAGES.UNKNOWN_ERROR);
      }
    }

    checkConnection();
  }, []);

  if (status === 'checking') {
    return null;
  }

  if (status === 'error') {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
        <div className="flex items-center">
          <span className="text-red-600 dark:text-red-400 mr-2">❌</span>
          <span className="text-sm text-red-700 dark:text-red-300">
            Error de conexión: {error}
          </span>
        </div>
      </div>
    );
  }

  return null;
}
