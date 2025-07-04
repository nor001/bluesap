import {
    convertToCSV,
    createCSVMetadata,
} from '@/lib/csv-processor';
import {
    CSV_FILE_NAME,
    updateCSVMetadata,
    uploadFileToSupabase,
} from '@/lib/supabase';
import { ROLES } from '@/lib/types/roles';
import { STATUS_CODES } from '@/lib/types/status-codes';
import { NextRequest, NextResponse } from 'next/server';

interface SyncResponse {
  success: boolean;
  error?: string;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<SyncResponse>> {
  try {
    const { data } = await request.json();

    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No valid data provided',
        },
        { status: STATUS_CODES.BAD_REQUEST }
      );
    }

    // Convert processed data back to CSV format
    const csvFormat = convertToCSV(data as any);

    // Create a File object from the CSV format
    const blob = new Blob([csvFormat], { type: 'text/csv' });
    const file = new File([blob], CSV_FILE_NAME, { type: 'text/csv' });

    // Try to upload to Supabase Storage
    const uploadSuccess = await uploadFileToSupabase(file);

    if (uploadSuccess) {
      // Create metadata using centralized function
      const metadataToUpdate = createCSVMetadata(
        data,
        file.size,
        ROLES.USER
      );

      const metadataUpdated = await updateCSVMetadata(metadataToUpdate);

      if (metadataUpdated) {
        return NextResponse.json({
          success: true,
        });
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to sync to Supabase',
      },
      { status: STATUS_CODES.INTERNAL_SERVER_ERROR }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Sync failed',
      },
      { status: STATUS_CODES.INTERNAL_SERVER_ERROR }
    );
  }
}
