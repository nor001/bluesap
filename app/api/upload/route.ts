import { NextRequest, NextResponse } from 'next/server';
import { updateCSVMetadata } from '@/lib/supabase';
import { setFallbackData } from '@/lib/fallback-storage';
import { 
  processSpecialCSV, 
  createCSVMetadata
} from '@/lib/csv-processor';

interface UploadResponse {
  success: boolean;
  data?: unknown[];
  metadata?: unknown;
  error?: string;
  errorType?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<UploadResponse>> {
  try {
    const formData = await request.formData();
    const file = formData.get('csv') as File;

    if (!file) {
      return NextResponse.json({ 
        success: false, 
        error: 'No file provided' 
      });
    }

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid file type. Please upload a CSV file.' 
      });
    }

    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ 
        success: false, 
        error: 'File too large. Maximum size is 50MB.' 
      });
    }

    // Read and process the file
    const csvText = await file.text();
    
    try {
    const processedData = processSpecialCSV(csvText);

    // Create metadata
    const metadata = createCSVMetadata(
      processedData.data,
      file.size,
      'user'
    );

      // Try to save to Supabase
    try {
      await updateCSVMetadata(metadata);
      } catch {
        // Supabase failed, continue with fallback
    }

      // Always save to fallback storage
      setFallbackData(processedData.data, metadata as unknown as Record<string, unknown>);

    return NextResponse.json({
      success: true,
      data: processedData.data,
        metadata: metadata
      });
    } catch {
      return NextResponse.json({
        success: false,
        error: 'Failed to process CSV file. Please check the file format.'
      });
    }
  } catch {
    return NextResponse.json({ 
      success: false, 
      error: 'Upload failed. Please try again.'
    });
  }
} 