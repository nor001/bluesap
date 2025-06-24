'use client';

import { useState, useEffect } from 'react';
import { Info, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface SupabaseStatusData {
  success: boolean;
  error?: string;
  details?: {
    hasUrl: boolean;
    hasKey: boolean;
    hasServiceKey: boolean;
    url: string;
    key: string;
    serviceKey: string;
    instructions?: string[];
    bucketExists?: boolean;
    bucketName?: string;
    filesInBucket?: number;
    databaseConnection?: string;
    databaseError?: string;
  };
}

export function SupabaseStatus() {
  const [status, setStatus] = useState<SupabaseStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-supabase');
      const data = await response.json();
      setStatus(data);
      setLastChecked(new Date());
    } catch (error) {
      setStatus({
        success: false,
        error: 'Error al verificar conexión',
        details: {
          hasUrl: false,
          hasKey: false,
          hasServiceKey: false,
          url: 'Error',
          key: 'Error',
          serviceKey: 'Error'
        }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  if (loading) {
    return (
      <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
        <div className="flex items-center">
          <RefreshCw className="h-5 w-5 text-blue-400 dark:text-blue-300 mr-2 animate-spin" />
          <span className="text-sm text-blue-700 dark:text-blue-300">Verificando conexión a Supabase...</span>
        </div>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  if (status.success) {
    return (
      <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
        <div className="flex items-start">
          <CheckCircle className="h-5 w-5 text-green-400 dark:text-green-300 mr-2 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-green-700 dark:text-green-300">
            <p className="font-medium mb-1">✅ Conexión a Supabase Exitosa</p>
            <div className="text-xs space-y-1">
              <p>Bucket: {status.details?.bucketExists ? '✅' : '❌'} {status.details?.bucketName}</p>
              <p>Archivos: {status.details?.filesInBucket || 0}</p>
              <p>Base de datos: {status.details?.databaseConnection === 'OK' ? '✅' : '❌'}</p>
              {lastChecked && (
                <p className="text-gray-500">Última verificación: {lastChecked.toLocaleTimeString()}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
      <div className="flex items-start">
        <XCircle className="h-5 w-5 text-red-400 dark:text-red-300 mr-2 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-red-700 dark:text-red-300">
          <p className="font-medium mb-1">❌ Error de Conexión a Supabase</p>
          <p className="mb-2">{status.error}</p>
          
          {status.details && (
            <div className="text-xs space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="font-medium">URL:</span> 
                  <span className={`ml-1 ${status.details.hasUrl ? 'text-green-600' : 'text-red-600'}`}>
                    {status.details.hasUrl ? '✅' : '❌'} {status.details.url}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Clave:</span> 
                  <span className={`ml-1 ${status.details.hasKey ? 'text-green-600' : 'text-red-600'}`}>
                    {status.details.hasKey ? '✅' : '❌'} {status.details.key}
                  </span>
                </div>
              </div>
              
              {status.details.instructions && (
                <div className="mt-2">
                  <p className="font-medium mb-1">Instrucciones para solucionar:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    {status.details.instructions.map((instruction, index) => (
                      <li key={index}>{instruction}</li>
                    ))}
                  </ol>
                </div>
              )}
              
              <button
                onClick={checkStatus}
                className="mt-2 px-3 py-1 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300 rounded text-xs hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
              >
                <RefreshCw className="h-3 w-3 inline mr-1" />
                Verificar de nuevo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 