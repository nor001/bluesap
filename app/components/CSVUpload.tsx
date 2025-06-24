'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, FileText, AlertCircle, Info, Clock, Calendar } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function CSVUpload() {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadCSV, csvMetadata, fetchCSVMetadata } = useAppStore();

  // Fetch CSV metadata on component mount
  useEffect(() => {
    fetchCSVMetadata().catch((error) => {
      // Silently fail - metadata is optional
    });
  }, [fetchCSVMetadata]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    setError(null);
    setUploading(true);

    try {
      // Validate file type
      if (!file.name.toLowerCase().endsWith('.csv')) {
        throw new Error('Please upload a CSV file');
      }

      // Validate file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        throw new Error('File size must be less than 50MB');
      }

      await uploadCSV(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "dd 'de' MMMM 'de' yyyy", { locale: es });
    } catch {
      return dateString;
    }
  };

  // Format time for display
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'HH:mm:ss');
    } catch {
      return '';
    }
  };

  return (
    <div className="w-full">
      {/* Info about CSV format */}
      <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
        <div className="flex items-start">
          <Info className="h-5 w-5 text-blue-400 dark:text-blue-300 mr-2 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <p className="font-medium mb-1">📋 Formato CSV Especial</p>
            <p>Tu archivo CSV debe tener la cabecera en la <strong>3ra línea</strong>. Las primeras 2 líneas serán ignoradas automáticamente.</p>
          </div>
        </div>
      </div>

      {/* Supabase Connection Info */}
      {!csvMetadata && (
        <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-yellow-400 dark:text-yellow-300 mr-2 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-700 dark:text-yellow-300">
              <p className="font-medium mb-1">⚠️ Conexión a Supabase</p>
              <p className="mb-2">No se pudo conectar a Supabase. Puedes subir archivos CSV para procesamiento local.</p>
              <div className="text-xs space-y-1">
                <p><strong>Para habilitar Supabase:</strong></p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Copia <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">env.example</code> como <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">.env.local</code></li>
                  <li>Configura tus credenciales de Supabase en <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">.env.local</code></li>
                  <li>Reinicia el servidor de desarrollo</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSV Update Info */}
      {csvMetadata && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
          <div className="flex items-start">
            <Clock className="h-5 w-5 text-green-400 dark:text-green-300 mr-2 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-green-700 dark:text-green-300">
              <p className="font-medium mb-1">📅 Última Actualización del CSV</p>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>{formatDate(csvMetadata.uploaded_at)}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>{formatTime(csvMetadata.uploaded_at)}</span>
                </div>
              </div>
              <p className="text-xs mt-1">
                Filas: {csvMetadata.row_count} | Tamaño: {(csvMetadata.file_size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
        </div>
      )}

      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive 
            ? 'border-primary-500 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileInput}
          className="hidden"
        />

        <div className="flex flex-col items-center">
          {uploading ? (
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400 mb-4"></div>
          ) : (
            <Upload className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
          )}

          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {uploading ? 'Subiendo...' : 'Sube tu archivo CSV'}
          </h3>
          
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Arrastra y suelta tu archivo CSV aquí, o{' '}
            <button
              type="button"
              onClick={openFileDialog}
              className="text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 font-medium"
            >
              busca archivos
            </button>
          </p>

          <div className="flex items-center justify-center text-xs text-gray-400 dark:text-gray-500">
            <FileText className="h-4 w-4 mr-1" />
            Solo archivos CSV, máximo 50MB
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-center p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <AlertCircle className="h-5 w-5 text-red-400 dark:text-red-300 mr-2" />
          <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
        </div>
      )}
    </div>
  );
} 