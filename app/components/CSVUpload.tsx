'use client';

import { useAppStore } from '@/lib/store';
import Papa from 'papaparse';
import React, { useCallback, useState } from 'react';

interface SAPProjectData {
  fecha_inicio: string;
  fecha_fin: string;
  responsable: string;
  duracion: number;
  proyecto?: string;
  modulo?: string;
  grupo_dev?: string;
  [key: string]: unknown;
}

/**
 * Component for uploading and processing SAP project CSV files
 * Handles different CSV formats and corporate validations
 */
export function CSVUpload() {
  const { uploadParsedCSVData, csvData } = useAppStore();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  /**
   * Validates and processes CSV file for SAP projects
   */
  const handleCSVFileUpload = useCallback(async (file: File) => {
    setIsUploading(true);
    setUploadStatus('idle');
    setErrorMessage('');

    try {
      // Validate file type and size for SAP project data
      const validateSAPCSVFile = (file: File): void => {
        const maxSize = 10 * 1024 * 1024; // 10MB limit for SAP project files
        const allowedTypes = ['text/csv', 'application/csv', 'application/vnd.ms-excel'];
        
        if (file.size > maxSize) {
          throw new Error('El archivo es demasiado grande. Máximo 10MB permitido.');
        }
        
        if (!allowedTypes.includes(file.type) && !file.name.endsWith('.csv')) {
          throw new Error('Solo se permiten archivos CSV para proyectos SAP.');
        }
      };

      validateSAPCSVFile(file);

      // Parse CSV with Papa Parse for SAP project data
      const parseSAPCSVData = (file: File): Promise<SAPProjectData[]> => {
        return new Promise((resolve, reject) => {
          Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
              if (results.errors.length > 0) {
                reject(new Error(`Error al procesar CSV: ${results.errors[0].message}`));
                return;
              }
              resolve(results.data as SAPProjectData[]);
            },
            error: (error) => {
              reject(new Error(`Error de parsing: ${error.message}`));
            }
          });
        });
      };

      const parsedCSVData = await parseSAPCSVData(file);
      
      // Validate SAP project data structure
      const validateSAPProjectData = (data: SAPProjectData[]): void => {
        if (data.length === 0) {
          throw new Error('El archivo CSV está vacío o no contiene datos válidos.');
        }

        const requiredColumns = ['fecha_inicio', 'fecha_fin', 'responsable', 'duracion'];
        const firstRow = data[0];
        const missingColumns = requiredColumns.filter(col => !(col in firstRow));
        
        if (missingColumns.length > 0) {
          throw new Error(`Columnas requeridas faltantes: ${missingColumns.join(', ')}`);
        }
      };

      validateSAPProjectData(parsedCSVData);

      // Upload processed SAP project data
      await uploadParsedCSVData(parsedCSVData);
      setUploadStatus('success');
      
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error desconocido');
      setUploadStatus('error');
    } finally {
      setIsUploading(false);
    }
  }, [uploadParsedCSVData]);

  /**
   * Handles file selection event
   */
  const handleFileSelection = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleCSVFileUpload(file);
    }
  }, [handleCSVFileUpload]);

  /**
   * Handles CSV file drag and drop
   */
  const handleFileDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      handleCSVFileUpload(file);
    }
  }, [handleCSVFileUpload]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Cargar Datos de Proyectos SAP
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Sube un archivo CSV con los datos de planificación de proyectos y recursos ABAP
        </p>
      </div>

      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isUploading
            ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20'
            : uploadStatus === 'success'
            ? 'border-green-300 bg-green-50 dark:bg-green-900/20'
            : uploadStatus === 'error'
            ? 'border-red-300 bg-red-50 dark:bg-red-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
        }`}
        onDrop={handleFileDrop}
        onDragOver={handleDragOver}
      >
        {isUploading ? (
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-blue-600 dark:text-blue-400 font-medium">
              Procesando archivo CSV de proyectos SAP...
            </p>
          </div>
        ) : uploadStatus === 'success' ? (
          <div className="space-y-4">
            <div className="text-green-600 dark:text-green-400 text-4xl">✅</div>
            <p className="text-green-600 dark:text-green-400 font-medium">
              Datos de proyectos SAP cargados exitosamente
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {csvData?.length || 0} registros procesados
            </p>
          </div>
        ) : uploadStatus === 'error' ? (
          <div className="space-y-4">
            <div className="text-red-600 dark:text-red-400 text-4xl">❌</div>
            <p className="text-red-600 dark:text-red-400 font-medium">
              Error al procesar archivo
            </p>
            <p className="text-sm text-red-500 dark:text-red-400">{errorMessage}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-gray-400 dark:text-gray-500 text-4xl">📁</div>
            <p className="text-gray-600 dark:text-gray-400">
              Arrastra y suelta tu archivo CSV aquí, o{' '}
              <label className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer font-medium">
                selecciona un archivo
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelection}
                  className="hidden"
                />
              </label>
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Formatos soportados: CSV (máximo 10MB)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
