export enum CSVErrorType {
  HEADER_NOT_FOUND = 'header_not_found',
  INVALID_DATE_FORMAT = 'invalid_date_format',
  MISSING_REQUIRED_COLUMNS = 'missing_required_columns',
  EMPTY_DATA = 'empty_data',
  INVALID_FILE_FORMAT = 'invalid_file_format',
  FILE_TOO_LARGE = 'file_too_large',
  ENCODING_ERROR = 'encoding_error',
  PARSE_ERROR = 'parse_error'
}

export interface CSVError {
  type: CSVErrorType;
  message: string;
  details?: any;
  column?: string;
  row?: number;
  value?: string;
}

export class CSVErrorHandler {
  private static errorMessages = {
    [CSVErrorType.HEADER_NOT_FOUND]: {
      es: 'No se encontró la cabecera en la fila esperada. Verifique que el archivo tenga el formato correcto.',
      en: 'Header not found in expected row. Please verify the file format.'
    },
    [CSVErrorType.MISSING_REQUIRED_COLUMNS]: {
      es: 'Faltan columnas requeridas: {columns}. Verifique que el archivo contenga todas las columnas necesarias.',
      en: 'Missing required columns: {columns}. Please verify the file contains all necessary columns.'
    },
    [CSVErrorType.EMPTY_DATA]: {
      es: 'El archivo no contiene datos válidos. Verifique que haya al menos una fila de datos.',
      en: 'The file contains no valid data. Please verify there is at least one data row.'
    },
    [CSVErrorType.INVALID_DATE_FORMAT]: {
      es: 'Formato de fecha inválido en la columna {column}. Use el formato DD/MM/YYYY o YYYY-MM-DD.',
      en: 'Invalid date format in column {column}. Use DD/MM/YYYY or YYYY-MM-DD format.'
    },
    [CSVErrorType.FILE_TOO_LARGE]: {
      es: 'El archivo es demasiado grande. El tamaño máximo permitido es 50MB.',
      en: 'File is too large. Maximum allowed size is 50MB.'
    },
    [CSVErrorType.INVALID_FILE_FORMAT]: {
      es: 'Formato de archivo inválido. Solo se permiten archivos CSV.',
      en: 'Invalid file format. Only CSV files are allowed.'
    },
    [CSVErrorType.ENCODING_ERROR]: {
      es: 'Error de codificación del archivo. Use UTF-8 o ISO-8859-1.',
      en: 'File encoding error. Use UTF-8 or ISO-8859-1.'
    },
    [CSVErrorType.PARSE_ERROR]: {
      es: 'Error al procesar el archivo CSV: {details}',
      en: 'Error processing CSV file: {details}'
    }
  };

  static createError(type: CSVErrorType, language: 'es' | 'en' = 'es', details?: any): CSVError {
    const messageTemplate = this.errorMessages[type][language];
    let message = messageTemplate;

    // Reemplazar placeholders
    if (details?.columns) {
      message = message.replace('{columns}', details.columns.join(', '));
    }
    if (details?.column) {
      message = message.replace('{column}', details.column);
    }
    if (details?.details) {
      message = message.replace('{details}', details.details);
    }

    return {
      type,
      message,
      details
    };
  }

  static formatErrorForUser(error: CSVError): string {
    return error.message;
  }

  static formatErrorForLog(error: CSVError): string {
    return `CSV Error [${error.type}]: ${error.message}${error.details ? ` | Details: ${JSON.stringify(error.details)}` : ''}`;
  }
} 