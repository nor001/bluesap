import { CSVErrorHandler, CSVErrorType } from '@/lib/csv-errors';
import { createCSVMetadata, processCSV } from '@/lib/csv-processor';
import { setFallbackData } from '@/lib/fallback-storage';
import { Logger } from '@/lib/logger';
import { updateCSVMetadata } from '@/lib/supabase';
import { ERROR_MESSAGES } from '@/lib/types/error-messages';
import { ROLES } from '@/lib/types/roles';
import { NextRequest, NextResponse } from 'next/server';

interface UploadResponse {
  success: boolean;
  data?: unknown[];
  metadata?: unknown;
  error?: string;
  errorType?: string;
  profile?: string;
  validation?: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<UploadResponse>> {
  Logger.info('CSV upload request received', 'UploadAPI');

  try {
    const formData = await request.formData();
    const file = formData.get('csv') as File;

    if (!file) {
      Logger.warn('No file provided in upload request', 'UploadAPI');
      return NextResponse.json({
        success: false,
        error: 'No file provided',
      });
    }

    Logger.info('File received', 'UploadAPI', { 
      fileName: file.name, 
      fileSize: file.size,
      fileType: file.type 
    });

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      const error = CSVErrorHandler.createError(CSVErrorType.INVALID_FILE_FORMAT);
      Logger.warn('Invalid file type uploaded', 'UploadAPI', { fileName: file.name });
      return NextResponse.json({
        success: false,
        error: error.message,
        errorType: error.type
      });
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      const error = CSVErrorHandler.createError(CSVErrorType.FILE_TOO_LARGE);
      Logger.warn('File too large', 'UploadAPI', { 
        fileName: file.name, 
        fileSize: file.size,
        maxSize 
      });
      return NextResponse.json({
        success: false,
        error: error.message,
        errorType: error.type
      });
    }

    // Read and process the file
    const csvText = await file.text();
    Logger.info('CSV file read successfully', 'UploadAPI', { 
      textLength: csvText.length,
      firstLines: csvText.split('\n').slice(0, 3) 
    });

    try {
      // Process CSV with SAP profile
      const result = processCSV(csvText, 'sap-ricesfw');

      Logger.info('CSV processing completed', 'UploadAPI', {
        profile: result.profile,
        originalRows: result.originalRowCount,
        processedRows: result.rowCount,
        validation: result.validation
      });

      // Create metadata
      const metadata = createCSVMetadata(result.data, file.size, ROLES.USER);

      // Try to save to Supabase
      try {
        await updateCSVMetadata(metadata);
        Logger.info('Data saved to Supabase successfully', 'UploadAPI');
      } catch (supabaseError) {
        Logger.warn('Supabase save failed, using fallback', 'UploadAPI', { 
          error: supabaseError instanceof Error ? supabaseError.message : ERROR_MESSAGES.UNKNOWN_ERROR 
        });
        // Supabase failed, continue with fallback
      }

      // Always save to fallback storage
      setFallbackData(
        result.data as unknown as Record<string, unknown>[],
        metadata as unknown as Record<string, unknown>
      );

      Logger.info('Upload completed successfully', 'UploadAPI', {
        profile: result.profile,
        rowsProcessed: result.rowCount
      });

      return NextResponse.json({
        success: true,
        data: result.data,
        metadata: metadata,
        profile: result.profile,
        validation: result.validation
      });
    } catch (processingError) {
      Logger.error('CSV processing failed', 'UploadAPI', { 
        error: processingError instanceof Error ? processingError.message : ERROR_MESSAGES.UNKNOWN_ERROR,
        fileName: file.name 
      });
      
      return NextResponse.json({
        success: false,
        error: processingError instanceof Error ? processingError.message : ERROR_MESSAGES.UNKNOWN_ERROR,
        errorType: 'processing_error'
      });
    }
  } catch (error) {
    Logger.error('Upload request failed', 'UploadAPI', { 
      error: error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR 
    });
    
    return NextResponse.json({
      success: false,
      error: 'Upload failed. Please try again.',
      errorType: 'general_error'
    });
  }
}
