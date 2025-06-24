import { NextRequest, NextResponse } from 'next/server';
import { uploadFileToSupabase, updateCSVMetadata } from '@/lib/supabase';
import { convertToOriginalCSVFormat, createCSVMetadata } from '@/lib/csv-processor';

interface SyncResponse {
  success: boolean;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<SyncResponse>> {
  try {
    const { data } = await request.json();

    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No valid data provided'
      }, { status: 400 });
    }

    // Convert processed data back to original CSV format
    const originalFormat = convertToOriginalCSVFormat(data);

    // Create a File object from the original format
    const blob = new Blob([originalFormat], { type: 'text/csv' });
    const file = new File([blob], 'central.csv', { type: 'text/csv' });

    // Try to upload to Supabase Storage
    const uploadSuccess = await uploadFileToSupabase(file);
    
    if (uploadSuccess) {
      // Create metadata using centralized function
      const metadataToUpdate = createCSVMetadata(
        data, 
        file.size, 
        'user (synced)'
      );

      const metadataUpdated = await updateCSVMetadata(metadataToUpdate);
      
      if (metadataUpdated) {
        return NextResponse.json({
          success: true
        });
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to sync to Supabase'
    }, { status: 500 });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Sync failed'
    }, { status: 500 });
  }
} 