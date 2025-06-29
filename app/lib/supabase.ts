import { createClient } from '@supabase/supabase-js';

// Use service role key for full admin access
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Check if Supabase is configured with service role key
const isSupabaseConfigured = supabaseUrl && supabaseServiceKey;

// Create Supabase client with service role key for full access
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: true,
        storageKey: 'sap-gestion-auth',
        autoRefreshToken: false,
      },
    })
  : null;

// Constants for CSV storage
export const CSV_BUCKET_NAME = 'csv-storage';
export const CSV_FILE_NAME = 'central.csv';
export const CSV_DOWNLOAD_NAME = 'sap_project_data.csv';
export const CSV_EXPORT_ORIGINAL = 'sap-projects.csv';
export const CSV_EXPORT_ASSIGNED = 'sap-projects-assigned.csv';
export const CSV_METADATA_TABLE = 'csv_metadata';

// Interface for CSV metadata
export interface CSVMetadata {
  id?: number;
  uploaded_at: string;
  file_size: number;
  uploaded_by?: string;
  row_count: number;
}

// Function to get CSV metadata with error handling
export async function getCSVMetadata(): Promise<CSVMetadata | null> {
  if (!isSupabaseConfigured) {
    return null;
  }

  try {
    const { data, error } = await supabase!
      .from(CSV_METADATA_TABLE)
      .select('*')
      .order('uploaded_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      return null;
    }

    return data;
  } catch {
    console.error('Failed to get CSV metadata from Supabase');
    return null;
  }
}

// Function to update CSV metadata with error handling
export async function updateCSVMetadata(metadata: CSVMetadata): Promise<boolean> {
  if (!isSupabaseConfigured) {
    return false;
  }

  try {
    const { error } = await supabase!
      .from(CSV_METADATA_TABLE)
      .upsert([metadata]);

    if (error) {
      return false;
    }

    return true;
  } catch {
    console.error('Failed to update CSV metadata in Supabase');
    return false;
  }
}

// Function to upload file to Supabase Storage with error handling
export async function uploadFileToSupabase(file: File): Promise<boolean> {
  if (!supabase) {
    return false;
  }

  try {
    const { error } = await supabase.storage
      .from(CSV_BUCKET_NAME)
      .upload(CSV_FILE_NAME, file, {
        upsert: true,
        contentType: 'text/csv'
      });

    if (error) {
      return false;
    }

    return true;
  } catch {
    console.error('Failed to upload file to Supabase');
    return false;
  }
}

// Function to download file from Supabase Storage with error handling and timeout
export async function downloadFileFromSupabase(): Promise<string | null> {
  if (!supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase.storage
      .from(CSV_BUCKET_NAME)
      .download(CSV_FILE_NAME);

    if (error) {
      return null;
    }

    if (!data) {
      return null;
    }

    const csvContent = await data.text();
    
    if (!csvContent || csvContent.trim().length === 0) {
      return null;
    }
    
    return csvContent;
  } catch {
    console.error('Failed to download file from Supabase');
    return null;
  }
} 