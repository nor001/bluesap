import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if Supabase is configured
const isSupabaseConfigured = supabaseUrl && supabaseAnonKey;

// Custom fetch function for corporate environments with SSL issues
const customFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  try {
    // For Node.js environment (server-side)
    if (typeof window === 'undefined') {
      // Use node-fetch or similar with custom SSL configuration
      const response = await fetch(input, {
        ...init,
        // Add headers that might help with corporate proxies
        headers: {
          ...init?.headers,
          'User-Agent': 'SAP-Gestion-NextJS/2.0.0',
        },
      });
      return response;
    }
    
    // For browser environment
    return fetch(input, init);
  } catch (error) {
    throw error;
  }
};

// Create Supabase client with error handling and custom fetch
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true, // Enable session persistence
        storageKey: 'sap-gestion-auth', // Custom storage key
      },
      global: {
        headers: {
          'X-Client-Info': 'sap-gestion-nextjs',
        },
        fetch: customFetch,
      },
    })
  : null;

// Constants for CSV storage
export const CSV_BUCKET_NAME = 'csv-storage';
export const CSV_FILE_NAME = 'central.csv';
export const CSV_METADATA_TABLE = 'csv_metadata';

// Interface for CSV metadata
export interface CSVMetadata {
  id: number;
  uploaded_at: string;
  file_size: number;
  uploaded_by?: string;
  row_count: number;
}

// Function to get CSV metadata with error handling
export async function getCSVMetadata(): Promise<CSVMetadata | null> {
  if (!supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from(CSV_METADATA_TABLE)
      .select('*')
      .order('uploaded_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      return null;
    }

    return data;
  } catch (error) {
    return null;
  }
}

// Function to update CSV metadata with error handling
export async function updateCSVMetadata(metadata: Omit<CSVMetadata, 'id'>): Promise<boolean> {
  if (!supabase) {
    return false;
  }

  try {
    const { error } = await supabase
      .from(CSV_METADATA_TABLE)
      .upsert([metadata], { onConflict: 'id' });

    if (error) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

// Function to upload file to Supabase Storage with error handling
export async function uploadFileToSupabase(file: File): Promise<boolean> {
  if (!supabase) {
    return false;
  }

  try {
    const { data, error } = await supabase.storage
      .from(CSV_BUCKET_NAME)
      .upload(CSV_FILE_NAME, file, {
        upsert: true,
        contentType: 'text/csv'
      });

    if (error) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
} 