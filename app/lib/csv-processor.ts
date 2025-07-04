import { CSVConfigManager } from './csv-config';
import { CSVErrorHandler, CSVErrorType } from './csv-errors';
import { logError } from './error-handler';
import { Logger } from './logger';
import { CSV_COLUMNS, REQUIRED_COLUMNS, isValidColumnName } from './types/csv-columns';

export interface CSVRow {
  [key: string]: unknown;
}

export interface ProcessedCSVData {
  data: CSVRowData[];
  rowCount: number;
  originalRowCount: number;
  profile: string;
  validation: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
}

export interface CSVMetadata {
  id?: number;
  uploaded_at: string;
  file_size: number;
  uploaded_by: string;
  row_count: number;
}

/**
 * Process CSV with improved error handling and configuration
 * @param csvText - CSV content as text
 * @param profileName - Optional profile name, will auto-detect if not provided
 * @returns Processed data and metadata
 */
export function processCSV(csvText: string, profileName?: string): ProcessedCSVData {
  Logger.info('Starting CSV processing', 'CSVProcessor', { profileName, textLength: csvText.length });

  try {
    // Use SAP profile by default
    if (!profileName) {
      profileName = 'sap-ricesfw';
    }

    const profile = CSVConfigManager.getProfile(profileName);
    
    // Split CSV into lines
    const lines = csvText.split(/\r?\n/);
    
    // Ensure we have at least 3 lines
    if (lines.length < 3) {
      throw new Error('CSV debe tener al menos 3 líneas (título, línea vacía, cabecera)');
    }
    
    // Extract header line (line 3, index 2) and clean it
    const headerLine = lines[2].trim();
    const headers = headerLine.split(',').map(col => col.trim()).filter(col => col !== '');
    
    Logger.debug('Header analysis', 'CSVProcessor', { 
      headerLine,
      headers,
      totalLines: lines.length
    });
    
    // Create CSV content starting from line 3
    const csvWithHeader = lines.slice(2).join('\n');

    Logger.debug('Processing CSV with profile', 'CSVProcessor', { 
      profile: profile.name, 
      headerRow: profile.headerRow,
      requiredColumns: profile.requiredColumns 
    });

    // Parse CSV manually to avoid PapaParse issues
    const csvLines = csvWithHeader.split(/\r?\n/);
    const data: CSVRow[] = [];
    
    // Column mapping using centralized configuration
    const columnMappings: Record<string, string> = Object.values(CSV_COLUMNS).reduce((acc, colName) => {
      acc[colName.toLowerCase()] = colName;
      return acc;
    }, {} as Record<string, string>);
    
    for (let i = 1; i < csvLines.length; i++) {
      const line = csvLines[i].trim();
      if (line === '') continue;
      
      const values = line.split(',').map(v => v.trim());
      const row: CSVRow = {};
      
      headers.forEach((header, index) => {
        // Apply column mapping if exists, otherwise use original header
        const headerStr = String(header);
        const mappedHeader = columnMappings[headerStr.toLowerCase()] || headerStr;
        row[mappedHeader] = values[index] || '';
      });
      
      data.push(row);
    }

    Logger.debug('Manual CSV parsing result', 'CSVProcessor', { 
      headers: headers,
      rowCount: data.length,
      firstRow: data[0] || {}
    });

    // Simple validation: check if required columns exist in headers
    const missingColumns = profile.requiredColumns.filter(col => {
      // Buscar coincidencia exacta
      const exactMatch = headers.some(header => header.trim() === col.trim());
      
      // Si no hay coincidencia exacta, buscar columnas que contengan las palabras clave
      if (!exactMatch) {
        const keywords = col.replace(/([A-Z])/g, ' $1').toLowerCase().split(' ').filter(k => k.length > 2);
        const partialMatch = headers.some(header => {
          const headerLower = header.toLowerCase();
          return keywords.some(keyword => headerLower.includes(keyword));
        });
        
        if (partialMatch) {
          Logger.info('Found partial match for column', 'CSVProcessor', {
            requiredColumn: col,
            matchingHeaders: headers.filter(header => {
              const headerLower = header.toLowerCase();
              return keywords.some(keyword => headerLower.includes(keyword));
            })
          });
          return false; // No es una columna faltante
        }
      }
      
      if (!exactMatch) {
        Logger.debug('Column not found', 'CSVProcessor', {
          requiredColumn: col,
          availableHeaders: headers,
          trimmedHeaders: headers.map(h => h.trim())
        });
      }
      
      return !exactMatch;
    });

    // Debug detallado
    Logger.info('DEBUG DETALLADO - Validación de columnas', 'CSVProcessor', {
      requiredColumns: profile.requiredColumns,
      availableHeaders: headers,
      missingColumns: missingColumns,
      validationResults: profile.requiredColumns.map(col => ({
        column: col,
        found: headers.includes(col),
        headersContaining: headers.filter(h => h.includes(col))
      }))
    });

    Logger.info('Column validation', 'CSVProcessor', {
      requiredColumns: profile.requiredColumns,
      availableHeaders: headers,
      missingColumns: missingColumns
    });

    if (missingColumns.length > 0) {
      const error = CSVErrorHandler.createError(
        CSVErrorType.MISSING_REQUIRED_COLUMNS,
        'es',
        { columns: missingColumns }
      );
      Logger.error('Missing required columns', 'CSVProcessor', { 
        missingColumns,
        availableHeaders: headers,
        profile: profile.name
      });
      throw new Error(error.message);
    }

    // Clean and validate data
    const originalRowCount = data.length;

    Logger.info('Data validation started', 'CSVProcessor', { 
      originalRowCount,
      requiredColumns: profile.requiredColumns.length 
    });

    // Improved data filtering: Remove rows that are clearly not data records
    const cleanedData = data.filter(row => {
      const keywords = row[CSV_COLUMNS.KEYWORDS];
      
      // Skip rows that are clearly not data records
      if (!keywords || keywords === '') {
        return false;
      }
      
      // Skip rows that are headers or metadata
      const keywordsStr = String(keywords);
      if (keywordsStr.toLowerCase() === 'keywords' || 
          keywordsStr.toLowerCase() === 'nan' ||
          keywordsStr.toLowerCase() === 'undefined' ||
          keywordsStr.toLowerCase() === 'null') {
        return false;
      }
      
      // Skip rows that are too long (likely descriptive text)
      if (typeof keywords === 'string' && keywords.length > 200) {
        Logger.debug('Skipping long descriptive row', 'CSVProcessor', {
          row: data.indexOf(row) + 1,
          keywordsLength: keywords.length,
          preview: keywords.substring(0, 100) + '...'
        });
        return false;
      }
      
      // Skip rows that contain common non-data indicators
      const nonDataIndicators = [
        'se deberá', 'deberá', 'revisar', 'api', 'integra', 'desarrollo',
        'crystian', 'habilidades', 'pública', 'supone', 'mencionar'
      ];
      
      const hasNonDataIndicators = nonDataIndicators.some(indicator => 
        keywordsStr.toLowerCase().includes(indicator)
      );
      
      if (hasNonDataIndicators) {
        Logger.debug('Skipping row with non-data indicators', 'CSVProcessor', {
          row: data.indexOf(row) + 1,
          keywords,
          indicators: nonDataIndicators.filter(indicator => 
            keywordsStr.toLowerCase().includes(indicator)
          )
        });
        return false;
      }
      
      return true;
    });

    Logger.debug('Data cleaning completed', 'CSVProcessor', { 
      originalRows: originalRowCount,
      cleanedRows: cleanedData.length,
      removedRows: originalRowCount - cleanedData.length 
    });

    // Normalize data with improved validation
    const normalizedData = cleanedData.map((row, index) => {
      const normalizedRow = { ...row } as any;

      // Normalize date columns with better error handling
      const dateColumns = [
        CSV_COLUMNS.EFFORT_READY_DATE,
        CSV_COLUMNS.EFFORT_EXECUTION_START,
        CSV_COLUMNS.PLANNED_ABAP_DEV_START,
        CSV_COLUMNS.PLANNED_ABAP_DEV_END,
        CSV_COLUMNS.ACTUAL_ABAP_DEV_START,
        CSV_COLUMNS.ACTUAL_ABAP_DEV_END,
        CSV_COLUMNS.PLANNED_CPI_DEV_START,
        CSV_COLUMNS.PLANNED_CPI_DEV_END
      ];

      dateColumns.forEach(col => {
        if (row[col] && typeof row[col] === 'string') {
          const dateValue = row[col] as string;
          
          // Skip if it's clearly not a date (contains text)
          if (dateValue.length > 50 || /[a-zA-Z]{3,}/.test(dateValue)) {
            Logger.debug('Skipping non-date value', 'CSVProcessor', { 
              column: col, 
              value: dateValue.substring(0, 50), 
              row: index + 1 
            });
            return;
          }
          
          try {
            let date: Date;
            
            // Try different date formats
            if (dateValue.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
              // DD/MM/YYYY
              const [day, month, year] = dateValue.split('/');
              date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            } else if (dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
              // YYYY-MM-DD
              date = new Date(dateValue);
            } else {
              // Try default parsing
              date = new Date(dateValue);
            }
            
            if (!isNaN(date.getTime())) {
              normalizedRow[col] = date.toISOString();
            } else {
              Logger.debug('Invalid date format (skipping)', 'CSVProcessor', { 
                column: col, 
                value: dateValue, 
                row: index + 1 
              });
            }
          } catch (_error) {
            Logger.debug('Date parsing failed (skipping)', 'CSVProcessor', { 
              column: col, 
              value: row[col], 
              row: index + 1
            });
          }
        }
      });

      // Normalize numeric columns with better validation
      const numericColumns = [
        CSV_COLUMNS.ABAP_DEVELOPMENT_TIME,
        CSV_COLUMNS.ABAP_TEST_TIME,
        CSV_COLUMNS.CPI_DEVELOPMENT_TIME,
        CSV_COLUMNS.CPI_TEST_TIME,
        CSV_COLUMNS.PLANNED_ABAP_DEVELOPMENT_TIME,
        CSV_COLUMNS.EFFORT_RECEIVED_PLAN,
        CSV_COLUMNS.EFFORT_RECEIVED_REAL
      ];

      numericColumns.forEach(col => {
        if (row[col] && typeof row[col] === 'string') {
          const numValue = row[col] as string;
          
          // Skip if it's clearly not a number (contains text)
          if (numValue.length > 20 || /[a-zA-Z]{2,}/.test(numValue)) {
            Logger.debug('Skipping non-numeric value', 'CSVProcessor', { 
              column: col, 
              value: numValue, 
              row: index + 1 
            });
            return;
          }
          
          const num = parseFloat(numValue);
          if (!isNaN(num)) {
            normalizedRow[col] = num;
          } else {
            Logger.debug('Invalid number format (skipping)', 'CSVProcessor', { 
              column: col, 
              value: numValue, 
              row: index + 1 
            });
          }
        }
      });

      return normalizedRow;
    });

    Logger.info('CSV processing completed successfully', 'CSVProcessor', {
      profile: profile.name,
      originalRows: originalRowCount,
      processedRows: normalizedData.length,
      validationErrors: 0
    });

    return {
      data: normalizedData,
      rowCount: normalizedData.length,
      originalRowCount,
      profile: profile.name,
      validation: {
        isValid: true,
        errors: [],
        warnings: []
      }
    };

  } catch (error) {
    Logger.error('CSV processing failed', 'CSVProcessor', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      profileName 
    });
    throw error;
  }
}

/**
 * Convert CSV data back to CSV format
 * @param data - Processed data
 * @returns CSV string with camelCase headers
 */
export function convertToCSV(data: CSVRowData[]): string {
  if (!data || data.length === 0) {
    throw new Error('No data to convert');
  }

  const headers = Object.values(CSV_COLUMNS);
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

  return csvContent;
}

/**
 * Create metadata for CSV data
 * @param data - Processed data
 * @param fileSize - Original file size
 * @param uploadedBy - Who uploaded the file
 * @param id - Optional ID for metadata
 * @returns CSV metadata
 */
export function createCSVMetadata(
  data: CSVRowData[],
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

/**
 * Validate CSV columns against expected schema
 * @param headers - Array of column headers from CSV
 * @returns Validation result with missing and extra columns
 */
export function validateCSVColumns(headers: string[]): {
  isValid: boolean;
  missingColumns: string[];
  extraColumns: string[];
  expectedColumns: string[];
} {
  const expectedColumns = Object.values(CSV_COLUMNS);
  const missingColumns = expectedColumns.filter(col => !headers.includes(col));
  const extraColumns = headers.filter(col => !expectedColumns.includes(col as any));
  
  return {
    isValid: missingColumns.length === 0,
    missingColumns,
    extraColumns,
    expectedColumns
  };
}

/**
 * Get column statistics for CSV data
 * @param data - CSV data
 * @returns Statistics about the data
 */
export function getCSVStatistics(data: CSVRowData[]) {
  const stats = {
    totalRows: data.length,
    columns: Object.values(CSV_COLUMNS).length,
    dateColumns: 0,
    numericColumns: 0,
    textColumns: 0,
    emptyRows: 0,
    averageEffortPlan: 0,
    averageEffortReal: 0
  };

  if (data.length === 0) return stats;

  // Count data types
  const firstRow = data[0];
  Object.values(CSV_COLUMNS).forEach(column => {
    const value = firstRow[column as keyof CSVRowData];
    if (value && typeof value === 'object' && 'getTime' in value || (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/))) {
      stats.dateColumns++;
    } else if (typeof value === 'number') {
      stats.numericColumns++;
    } else {
      stats.textColumns++;
    }
  });

  // Count empty rows
  stats.emptyRows = data.filter(row => 
    !row.keywords || row.keywords === '' || row.keywords === 'nan'
  ).length;

  // Calculate averages
  const effortPlanValues = data
    .map(row => row.effortReceivedPlan)
    .filter(val => typeof val === 'number' && !isNaN(val as number));
  
  const effortRealValues = data
    .map(row => row.effortReceivedReal)
    .filter(val => typeof val === 'number' && !isNaN(val as number));

  if (effortPlanValues.length > 0) {
    stats.averageEffortPlan = effortPlanValues.reduce((sum, val) => sum + (val as number), 0) / effortPlanValues.length;
  }

  if (effortRealValues.length > 0) {
    stats.averageEffortReal = effortRealValues.reduce((sum, val) => sum + (val as number), 0) / effortRealValues.length;
  }

  return stats;
}

/**
 * Process CSV data with centralized column configuration
 * @ai-function Processes CSV data using centralized column names
 * @ai-returns Processed CSV data with normalized column names
 */
export async function processCSVData(csvText: string): Promise<Array<Record<string, unknown>>> {
  try {
    // Split into lines and clean
    const lines = csvText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (lines.length < 4) {
      throw new ValidationError('CSV must have at least 4 lines (header + data)');
    }

    // Always use line 3 as header (index 2)
    const headerLine = lines[2];
    const dataLines = lines.slice(3);

    // Parse header with centralized column validation
    const headers = headerLine.split(',').map(h => h.trim().replace(/"/g, ''));
    
    // Validate required columns
    const missingColumns = REQUIRED_COLUMNS.filter(requiredCol => 
      !headers.some(header => header.toLowerCase() === requiredCol.toLowerCase())
    );

    if (missingColumns.length > 0) {
      throw new ValidationError(
        `Missing required columns: ${missingColumns.join(', ')}. ` +
        `Found columns: ${headers.join(', ')}`
      );
    }

    // Process data rows
    const processedData: Array<Record<string, unknown>> = [];

    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i];
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      
      // Skip rows with insufficient data
      if (values.length < headers.length) {
        continue;
      }

      // Skip rows with long descriptive text (likely headers or footers)
      const hasLongText = values.some(value => value.length > 100);
      if (hasLongText) {
        continue;
      }

      // Skip rows with common non-data indicators
      const nonDataIndicators = ['total', 'suma', 'promedio', 'average', 'count', 'fecha', 'date'];
      const hasNonDataIndicator = values.some(value => 
        nonDataIndicators.some(indicator => 
          value.toLowerCase().includes(indicator)
        )
      );
      if (hasNonDataIndicator) {
        continue;
      }

      const row: Record<string, unknown> = {};

      headers.forEach((header, index) => {
        const headerStr = String(header);
        
        // Use centralized column mapping
        const normalizedHeader = Object.values(CSV_COLUMNS).find(col => 
          col.toLowerCase() === headerStr.toLowerCase()
        ) || headerStr;

        // Only use valid column names
        if (isValidColumnName(normalizedHeader)) {
          row[normalizedHeader] = values[index] || '';
        } else {
          // Log unknown columns but continue processing
          console.warn(`Unknown column: ${headerStr}`);
        }
      });

      // Only add rows that have at least some valid data
      const hasValidData = Object.values(row).some(value => 
        value && String(value).trim().length > 0
      );
      
      if (hasValidData) {
        processedData.push(row);
      }
    }

    if (processedData.length === 0) {
      throw new DataProcessingError('No valid data rows found after processing');
    }

    return processedData;

  } catch (error) {
    logError(
      {
        type: 'processing',
        message: 'CSV processing failed',
        details: error,
        timestamp: Date.now(),
        userFriendly: true,
      },
      'csv-processor'
    );
    throw error;
  }
} 