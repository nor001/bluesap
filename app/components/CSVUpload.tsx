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
  const [metadataFetched, setMetadataFetched] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadCSV, csvMetadata, fetchCSVMetadata } = useAppStore();

  // Fetch CSV metadata on component mount (only once)
  useEffect(() => {
    if (!metadataFetched) {
      setMetadataFetched(true);
      // Always fetch fresh metadata from database, not from cache
      fetchCSVMetadata().catch((error) => {
        // Silently fail - metadata is optional
      });
    }
  }, [fetchCSVMetadata, metadataFetched]);

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
      {/* Info about CSV format - REMOVIDO */}

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

      {/* CSV Upload Area - Eliminado, ahora solo en el sidebar */}

      {error && (
        <div className="mt-4 flex items-center p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <AlertCircle className="h-5 w-5 text-red-400 dark:text-red-300 mr-2" />
          <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
        </div>
      )}
    </div>
  );
} 