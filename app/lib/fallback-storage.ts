// Simple in-memory storage for fallback when Supabase is not available
// This is only for the current session and will be lost on server restart

export interface FallbackData {
  csvData: any[];
  metadata: any;
}

let fallbackStorage: FallbackData = {
  csvData: [],
  metadata: null
};

export function setFallbackData(csvData: any[], metadata: any) {
  fallbackStorage = {
    csvData: [...csvData],
    metadata: { ...metadata }
  };
}

export function getFallbackData(): FallbackData {
  return {
    csvData: [...fallbackStorage.csvData],
    metadata: fallbackStorage.metadata ? { ...fallbackStorage.metadata } : null
  };
}

export function hasFallbackData(): boolean {
  return fallbackStorage.csvData.length > 0;
} 