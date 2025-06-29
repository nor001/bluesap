'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, Info } from 'lucide-react';
import { useAppStore } from '@/lib/store';

export function CSVUpload() {
  const [error, setError] = useState<string | null>(null);
  const [metadataFetched, setMetadataFetched] = useState(false);
  const { uploadCSV, csvMetadata, fetchCSVMetadata } = useAppStore();

  // Fetch CSV metadata on component mount (only once)
  useEffect(() => {
    if (!metadataFetched) {
      setMetadataFetched(true);
      // Always fetch fresh metadata from database, not from cache
      fetchCSVMetadata().catch(() => {
        // Silently fail - metadata is optional
      });
    }
  }, [fetchCSVMetadata, metadataFetched]);

  const handleFileUpload = async (file: File) => {
    setError(null);

    try {
      await uploadCSV(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20 mb-4">
            <Info className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>

          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Subir archivo CSV
          </h3>

          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Selecciona un archivo CSV con datos de proyectos SAP
          </p>

          <div className="space-y-4">
            {/* File Upload Input */}
            <div className="flex justify-center">
              <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors">
                Seleccionar archivo
                <input
                  type="file"
                  accept=".csv"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileUpload(file);
                    }
                  }}
                  className="hidden"
                />
              </label>
            </div>

            {/* Error Display */}
            {error && (
              <div className="flex items-center p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <AlertCircle className="h-4 w-4 text-red-400 mr-2" />
                <span className="text-sm text-red-700 dark:text-red-300">
                  {error}
                </span>
              </div>
            )}

            {/* Metadata Display */}
            {csvMetadata && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                <div className="text-sm text-green-700 dark:text-green-300">
                  <p className="font-medium">Última actualización:</p>
                  <p>{new Date(csvMetadata.uploaded_at).toLocaleString()}</p>
                  <p>Filas: {csvMetadata.row_count}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
