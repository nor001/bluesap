"use client";
import { useState, useEffect } from 'react';
import { supabaseClient, isSupabaseAvailable } from '@/lib/supabase-client';

export function SupabaseStatus() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkConnection() {
      if (!isSupabaseAvailable()) {
        setStatus('error');
        setError('Error de configuración');
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
        setError(err instanceof Error ? err.message : 'Error desconocido');
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