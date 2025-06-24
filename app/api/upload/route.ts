import { NextRequest, NextResponse } from 'next/server';
import { uploadFileToSupabase, updateCSVMetadata } from '@/lib/supabase';
import { setFallbackData } from '@/lib/fallback-storage';
import { 
  processSpecialCSV, 
  convertToOriginalCSVFormat, 
  createCSVMetadata, 
  validateCSVFile 
} from '@/lib/csv-processor';
import { 
  handleCSVError, 
  handleUploadError, 
  handleSupabaseError, 
  errorToResponse,
  logError 
} from '@/lib/error-handler';

interface UploadResponse {
  success: boolean;
  data?: any[];
  metadata?: any;
  error?: string;
  errorType?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<UploadResponse>> {
  try {
    const formData = await request.formData();
    const file = formData.get('csv') as File;

    if (!file) {
      const error = handleUploadError({ message: 'No file provided' });
      logError(error, 'Upload API');
      return NextResponse.json(errorToResponse(error), { status: 400 });
    }

    // Validate file using centralized validation
    if (!validateCSVFile(file)) {
      const error = handleUploadError({ message: 'Invalid file. Must be a CSV file under 50MB' });
      logError(error, 'Upload API');
      return NextResponse.json(errorToResponse(error), { status: 400 });
    }

    // Read file content
    const text = await file.text();

    // Process CSV using centralized processor with special case preservation
    let processedData;
    try {
      processedData = processSpecialCSV(text);
    } catch (csvError) {
      const error = handleCSVError(csvError);
      logError(error, 'Upload API');
      return NextResponse.json(errorToResponse(error), { status: 400 });
    }

    if (processedData.rowCount === 0) {
      const error = handleCSVError({ message: 'No valid data found in CSV file' });
      logError(error, 'Upload API');
      return NextResponse.json(errorToResponse(error), { status: 400 });
    }

    // Try to upload to Supabase Storage first
    let uploadSuccess = false;
    let metadata: any = undefined;

    try {
      // Convert back to original format for Supabase storage (preserving special format)
      const originalFormat = convertToOriginalCSVFormat(processedData.data);
      const originalBlob = new Blob([originalFormat], { type: 'text/csv' });
      const originalFile = new File([originalBlob], file.name, { type: 'text/csv' });

      uploadSuccess = await uploadFileToSupabase(originalFile);
      
      if (uploadSuccess) {
        // Create metadata using centralized function
        const metadataToUpdate = createCSVMetadata(
          processedData.data, 
          file.size, 
          'user'
        );

        const metadataUpdated = await updateCSVMetadata(metadataToUpdate);
        
        if (metadataUpdated) {
          metadata = metadataToUpdate;
        }
      }
    } catch (supabaseError) {
      // Supabase failed, use local fallback
      const error = handleSupabaseError(supabaseError);
      logError(error, 'Upload API - Supabase Fallback');
      // Continue with fallback - don't return error
    }

    // If Supabase failed, use local fallback
    if (!uploadSuccess) {
      // Create metadata for fallback
      const fallbackMetadata = createCSVMetadata(
        processedData.data, 
        file.size, 
        'user (local)'
      );
      
      setFallbackData(processedData.data, fallbackMetadata);
      metadata = fallbackMetadata;
    }

    return NextResponse.json({
      success: true,
      data: processedData.data,
      metadata: metadata
    });

  } catch (error) {
    const appError = handleUploadError(error);
    logError(appError, 'Upload API');
    return NextResponse.json(errorToResponse(appError), { status: 500 });
  }
} 