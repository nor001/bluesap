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
        const { data, error } = await supabaseClient!.auth.getSession();
        
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
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
          <span className="text-sm text-blue-700 dark:text-blue-300">Verificando conexión...</span>
        </div>
      </div>
    );
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

  return (
    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-3">
      <div className="flex items-center">
        <span className="text-green-600 dark:text-green-400 mr-2">✅</span>
        <span className="text-sm text-green-700 dark:text-green-300">
          Conectado a Supabase
        </span>
      </div>
    </div>
  );
} 