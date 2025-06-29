import Papa from 'papaparse';

export interface CSVRow {
  [key: string]: unknown;
}

export interface ProcessedCSVData {
  data: CSVRow[];
  rowCount: number;
  originalRowCount: number;
}

export interface CSVMetadata {
  id?: number;
  uploaded_at: string;
  file_size: number;
  uploaded_by: string;
  row_count: number;
}

/**
 * Procesa un CSV con formato especial (header en línea 3)
 * @param csvText - Contenido del CSV como texto
 * @returns Datos procesados y metadata
 */
export function processSpecialCSV(csvText: string): ProcessedCSVData {
  // Split text into lines and skip first 2 lines (special format)
  const lines = csvText.split('\n');
  
  if (lines.length < 3) {
    throw new Error('CSV file must have at least 3 lines');
  }
  
  // Remove first 2 lines and join the rest
  const csvContent = lines.slice(2).join('\n');
  
  // Parse CSV with Papa Parse using the 3rd line as header
  const result = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
    transform: (value) => value.trim()
  });

  if (result.errors.length > 0) {
    throw new Error(`CSV parsing errors: ${result.errors.map(e => e.message).join(', ')}`);
  }

  // Clean and validate data
  const data = result.data as CSVRow[];
  const originalRowCount = data.length;
  
  // Remove rows where PROY is empty or contains non-data values
  const cleanedData = data.filter(row => 
    row.PROY && 
    row.PROY !== '' && 
    row.PROY !== 'PROY' &&
    row.PROY !== 'nan'
  );

  // Normalize date columns
  const normalizedData = cleanedData.map(row => {
    const normalizedRow = { ...row };
    
    // Normalize date columns
    const dateColumns = [
      'esfu_disponible',
      'plan_abap_dev_ini',
      'Fecha Inicio Plan',
      'Fecha Fin Plan',
      'available_test_date',
      'plan_abap_pu_ini',
      'pu_ini',
      'Fecha Fin Real'
    ];

    dateColumns.forEach(col => {
      if (row[col]) {
        try {
          // Handle dd/mm/yyyy format
          const date = new Date(row[col] as string);
          if (!isNaN(date.getTime())) {
            normalizedRow[col] = date.toISOString();
          }
        } catch {
          // Failed to parse date, keep original value
          // Continue with next iteration
        }
      }
    });

    // Normalize numeric columns
    const numericColumns = ['plan_abap_dev_time', 'plan_abap_pu_time'];
    numericColumns.forEach(col => {
      if (row[col]) {
        const num = parseFloat(row[col] as string);
        if (!isNaN(num)) {
          normalizedRow[col] = num;
        }
      }
    });

    return normalizedRow;
  });

  return {
    data: normalizedData,
    rowCount: normalizedData.length,
    originalRowCount
  };
}

/**
 * Convierte datos procesados de vuelta al formato CSV original
 * @param data - Datos procesados
 * @returns CSV en formato original (con primeras 2 líneas)
 */
export function convertToOriginalCSVFormat(data: CSVRow[]): string {
  if (!data || data.length === 0) {
    throw new Error('No data to convert');
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      }).join(',')
    )
  ].join('\n');

  // Add the special header format
  return [
    'SAP Project Planning Data', // Line 1: Title
    '', // Line 2: Empty line
    csvContent // Line 3+: Headers and data
  ].join('\n');
}

/**
 * Convierte datos procesados a formato CSV simple (sin líneas especiales)
 * @param data - Datos procesados
 * @returns CSV simple para descarga
 */
export function convertToSimpleCSV(data: CSVRow[]): string {
  if (!data || data.length === 0) {
    throw new Error('No data to convert');
  }

  const headers = Object.keys(data[0]);
  return [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      }).join(',')
    )
  ].join('\n');
}

/**
 * Crea metadata para los datos procesados
 * @param data - Datos procesados
 * @param fileSize - Tamaño del archivo original
 * @param uploadedBy - Quién subió el archivo
 * @param id - ID opcional para la metadata
 * @returns Metadata del CSV
 */
export function createCSVMetadata(
  data: CSVRow[], 
  fileSize: number, 
  uploadedBy: string = 'user',
  id?: number
): CSVMetadata {
  return {
    id,
    uploaded_at: new Date().toISOString(),
    file_size: fileSize,
    uploaded_by: uploadedBy,
    row_count: data.length
  };
}

/**
 * Valida si un archivo CSV es válido
 * @param file - Archivo a validar
 * @returns true si es válido
 */
export function validateCSVFile(file: File): boolean {
  // Validate file type
  if (!file.name.toLowerCase().endsWith('.csv')) {
    return false;
  }

  // Validate file size (50MB limit)
  if (file.size > 50 * 1024 * 1024) {
    return false;
  }

  return true;
} 