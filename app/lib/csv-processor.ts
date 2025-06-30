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
 * Process CSV with special format (header on line 3)
 * @param csvText - CSV content as text
 * @returns Processed data and metadata
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
    transformHeader: header => header.trim(),
    transform: value => value.trim(),
  });

  if (result.errors.length > 0) {
    throw new Error(
      `CSV parsing errors: ${result.errors.map(e => e.message).join(', ')}`
    );
  }

  // Clean and validate data
  const data = result.data as CSVRow[];
  const originalRowCount = data.length;

  // Remove rows where PROY is empty or contains non-data values
  const cleanedData = data.filter(
    row =>
      row.PROY && row.PROY !== '' && row.PROY !== 'PROY' && row.PROY !== 'nan'
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
      'Fecha Fin Real',
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
    originalRowCount,
  };
}

/**
 * Convert processed data back to original CSV format
 * @param data - Processed data
 * @returns CSV in original format (with first 2 lines)
 */
export function convertToOriginalCSVFormat(data: CSVRow[]): string {
  if (!data || data.length === 0) {
    throw new Error('No data to convert');
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers
        .map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',')
            ? `"${value}"`
            : value;
        })
        .join(',')
    ),
  ].join('\n');

  // Add the special header format
  return [
    'SAP Project Planning Data', // Line 1: Title
    '', // Line 2: Empty line
    csvContent, // Line 3+: Headers and data
  ].join('\n');
}

/**
 * Convert processed data to simple CSV format (without special lines)
 * @param data - Processed data
 * @returns Simple CSV for download
 */
export function convertToSimpleCSV(data: CSVRow[]): string {
  if (!data || data.length === 0) {
    throw new Error('No data to convert');
  }

  const headers = Object.keys(data[0]);
  return [
    headers.join(','),
    ...data.map(row =>
      headers
        .map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',')
            ? `"${value}"`
            : value;
        })
        .join(',')
    ),
  ].join('\n');
}

/**
 * Create metadata for processed data
 * @param data - Processed data
 * @param fileSize - Original file size
 * @param uploadedBy - Who uploaded the file
 * @param id - Optional ID for metadata
 * @returns CSV metadata
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
    row_count: data.length,
  };
}

/**
 * Validate if a CSV file is valid
 * @param file - File to validate
 * @returns true if valid
 */
export function validateCSVFile(file: File): boolean {
  const maxSize = 50 * 1024 * 1024; // 50MB
  const allowedTypes = ['text/csv', 'application/csv', 'application/vnd.ms-excel'];
  
  if (file.size > maxSize) {
    return false;
  }
  
  if (!allowedTypes.includes(file.type) && !file.name.endsWith('.csv')) {
    return false;
  }
  
  return true;
}
