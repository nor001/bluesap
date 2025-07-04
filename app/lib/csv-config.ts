export interface CSVProfile {
  name: string;
  description: string;
  headerRow: number;
  requiredColumns: string[];
  optionalColumns: string[];
  dateFormats: string[];
  numberFormats: string[];
  delimiter?: string;
  encoding?: string;
  skipEmptyRows?: boolean;
}

export interface CSVConfig {
  headerRow: number;
  encoding: string;
  delimiter: string;
  skipEmptyRows: boolean;
  maxFileSize: number;
  allowedTypes: string[];
}

export const CSV_PROFILES: Record<string, CSVProfile> = {
  'sap-ricesfw': {
    name: 'SAP RICEFW',
    description: 'Matriz de RICEFWs con plan de esfuerzo',
    headerRow: 3,
    requiredColumns: [
      'plannedAbapDevStart',
      'plannedAbapDevEnd', 
      'abapAssigned',
      'abapDevelopmentTime'
    ],
    optionalColumns: [
      'abapTestTime',
      'cpiDevelopmentTime',
      'cpiTestTime',
      'effortReceivedPlan',
      'effortReceivedReal',
      'effortReadyDate',
      'effortExecutionStart',
      'keywords',
      'functionalAssigned',
      'actualAbapDevStart',
      'actualAbapDevEnd',
      'plannedCpiDevStart',
      'plannedCpiDevEnd'
    ],
    dateFormats: ['DD/MM/YYYY', 'YYYY-MM-DD', 'DD-MM-YYYY'],
    numberFormats: ['#,##0.00', '#,##0'],
    delimiter: ',',
    encoding: 'UTF-8',
    skipEmptyRows: true
  },
  'generic': {
    name: 'CSV Genérico',
    description: 'Perfil genérico para archivos CSV',
    headerRow: 1,
    requiredColumns: [],
    optionalColumns: [],
    dateFormats: ['DD/MM/YYYY', 'YYYY-MM-DD', 'MM/DD/YYYY'],
    numberFormats: ['#,##0.00', '#,##0'],
    delimiter: ',',
    encoding: 'UTF-8',
    skipEmptyRows: true
  }
};

export const DEFAULT_CSV_CONFIG: CSVConfig = {
  headerRow: 1,
  encoding: 'UTF-8',
  delimiter: ',',
  skipEmptyRows: true,
  maxFileSize: 50 * 1024 * 1024, // 50MB
  allowedTypes: ['text/csv', 'application/csv', 'application/vnd.ms-excel']
};

export class CSVConfigManager {
  static getProfile(profileName: string): CSVProfile {
    return CSV_PROFILES[profileName] || CSV_PROFILES['generic'];
  }

  static detectProfile(headers: string[]): string {
    // Detectar automáticamente el perfil basado en los headers
    const normalizedHeaders = headers.map(h => h.toLowerCase());
    
    // Verificar si contiene las columnas requeridas del perfil SAP
    const hasPlannedAbapDevStart = normalizedHeaders.includes('plannedabapdevstart');
    const hasAbapAssigned = normalizedHeaders.includes('abapassigned');
    const hasAbapDevelopmentTime = normalizedHeaders.includes('abapdevelopmenttime');
    const hasPlannedAbapDevEnd = normalizedHeaders.includes('plannedabapdevend');
    
    console.log('Profile detection:', {
      headers: headers,
      normalizedHeaders: normalizedHeaders,
      hasPlannedAbapDevStart,
      hasAbapAssigned,
      hasAbapDevelopmentTime,
      hasPlannedAbapDevEnd
    });
    
    if (hasPlannedAbapDevStart && hasAbapAssigned && hasAbapDevelopmentTime && hasPlannedAbapDevEnd) {
      return 'sap-ricesfw';
    }
    
    return 'generic';
  }

  static validateConfig(config: Partial<CSVConfig>): CSVConfig {
    return {
      ...DEFAULT_CSV_CONFIG,
      ...config
    };
  }

  static getColumnMapping(profileName: string): Record<string, string> {
    const profile = this.getProfile(profileName);
    
    // Mapeo simple y directo
    const mapping: Record<string, string> = {};
    
    // Mapeo directo para las columnas requeridas
    profile.requiredColumns.forEach(col => {
      mapping[col] = col; // Mapeo directo
    });
    
    return mapping;
  }
} 