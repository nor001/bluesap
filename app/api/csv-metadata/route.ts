import { NextResponse } from 'next/server';
import { getCSVMetadata } from '@/lib/supabase';
import { getCSVFromLocal } from '@/lib/local-storage';
import { MetadataResponse } from '@/lib/types';

export async function GET(): Promise<NextResponse<MetadataResponse>> {
  try {
    // Try to get metadata from Supabase first
    let metadata = await getCSVMetadata();

    // If Supabase fails, try local storage
    if (!metadata) {
      console.log('📋 Supabase metadata no disponible, intentando almacenamiento local...');
      const localData = getCSVFromLocal();
      
      if (localData) {
        metadata = {
          id: parseInt(localData.id),
          uploaded_at: localData.uploaded_at,
          file_size: localData.file_size,
          uploaded_by: localData.uploaded_by,
          row_count: localData.row_count
        };
        console.log('✅ Metadata obtenida de almacenamiento local:', metadata);
      }
    }

    if (!metadata) {
      return NextResponse.json({
        success: false,
        error: 'No CSV metadata found (Supabase not configured or no local data)'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      metadata
    });

  } catch (error) {
    console.error('Error fetching CSV metadata:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch CSV metadata'
    }, { status: 500 });
  }
} 