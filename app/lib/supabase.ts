import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Debug logs
console.log('🔍 [supabase.ts] Variables de entorno:');
console.log('📧 NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Configurado' : 'No configurado');
console.log('🔑 NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Configurado' : 'No configurado');

// Check if Supabase is configured
const isSupabaseConfigured = supabaseUrl && supabaseAnonKey;

if (!isSupabaseConfigured) {
  console.warn('⚠️ Supabase no está configurado. Las variables de entorno NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY son requeridas.');
} else {
  console.log('✅ Supabase configurado correctamente');
}

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
    console.error('Custom fetch error:', error);
    throw error;
  }
};

// Create Supabase client with error handling and custom fetch
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false, // Disable session persistence for server-side
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
    console.warn('Supabase no está configurado, no se puede obtener metadata');
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
      console.error('Error fetching CSV metadata:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching CSV metadata:', error);
    return null;
  }
}

// Function to update CSV metadata with error handling
export async function updateCSVMetadata(metadata: Omit<CSVMetadata, 'id'>): Promise<boolean> {
  if (!supabase) {
    console.warn('Supabase no está configurado, no se puede actualizar metadata');
    return false;
  }

  try {
    const { error } = await supabase
      .from(CSV_METADATA_TABLE)
      .upsert([metadata], { onConflict: 'id' });

    if (error) {
      console.error('Error updating CSV metadata:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating CSV metadata:', error);
    return false;
  }
}

// Function to upload file to Supabase Storage with error handling
export async function uploadFileToSupabase(file: File): Promise<boolean> {
  if (!supabase) {
    console.warn('Supabase no está configurado, no se puede subir archivo');
    return false;
  }

  try {
    console.log('🔄 Intentando subir archivo a Supabase Storage...');
    console.log('📁 Nombre del archivo:', file.name);
    console.log('📏 Tamaño del archivo:', file.size, 'bytes');
    console.log('🏪 Bucket:', CSV_BUCKET_NAME);
    console.log('📄 Nombre en storage:', CSV_FILE_NAME);

    const { data, error } = await supabase.storage
      .from(CSV_BUCKET_NAME)
      .upload(CSV_FILE_NAME, file, {
        upsert: true,
        contentType: 'text/csv'
      });

    if (error) {
      console.error('❌ Error al subir a Supabase Storage:', error);
      console.error('🔍 Detalles del error:', {
        message: error.message,
        name: error.name
      });
      return false;
    }

    console.log('✅ Archivo subido exitosamente a Supabase Storage');
    console.log('📊 Datos de respuesta:', data);
    return true;
  } catch (error) {
    console.error('💥 Error inesperado al subir a Supabase:', error);
    
    // Check if it's an SSL certificate error
    if (error instanceof Error && error.message.includes('certificate')) {
      console.warn('🔒 Error de certificado SSL detectado. Esto es común en entornos corporativos.');
      console.warn('💡 Solución: Configurar proxy corporativo o usar VPN.');
    }
    
    return false;
  }
} 