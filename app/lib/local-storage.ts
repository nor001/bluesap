// Local storage fallback for corporate environments with SSL issues
export interface LocalCSVData {
  id: string;
  uploaded_at: string;
  file_size: number;
  uploaded_by: string;
  row_count: number;
  csv_content: string;
}

const LOCAL_STORAGE_KEY = 'sap-gestion-csv-data';

// Function to save CSV data locally
export function saveCSVLocally(
  csvContent: string, 
  fileSize: number, 
  rowCount: number
): LocalCSVData {
  const csvData: LocalCSVData = {
    id: Date.now().toString(),
    uploaded_at: new Date().toISOString(),
    file_size: fileSize,
    uploaded_by: 'user',
    row_count: rowCount,
    csv_content: csvContent
  };

  // Save to localStorage (browser) or memory (server)
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(csvData));
  }

  return csvData;
}

// Function to get CSV data from local storage
export function getCSVFromLocal(): LocalCSVData | null {
  if (typeof window === 'undefined') {
    return null; // Server-side, no localStorage
  }

  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as LocalCSVData;
    }
  } catch (error) {
    // (log eliminado)
  }

  return null;
}

// Function to check if local storage is available
export function isLocalStorageAvailable(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

// Function to get CSV content as downloadable file
export function getCSVAsBlob(): Blob | null {
  const csvData = getCSVFromLocal();
  if (csvData && csvData.csv_content) {
    return new Blob([csvData.csv_content], { type: 'text/csv' });
  }
  return null;
} 