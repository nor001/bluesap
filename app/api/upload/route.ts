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
        error: 'File must be a CSV' 
      });
    }

    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ 
        success: false, 
        error: 'File size must be less than 50MB' 
      });
    }

    // Read file content
    const csvText = await file.text();
    
    // Process CSV with special format handling
    const processedData = processSpecialCSV(csvText);
    
    if (processedData.rowCount === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No valid data found in CSV' 
      });
    }

    // Create metadata
    const metadata = createCSVMetadata(
      processedData.data,
      file.size,
      'user'
    );

    // Try to update metadata in Supabase
    try {
      await updateCSVMetadata(metadata);
    } catch (_error) {
      // Supabase not available, continue with fallback
    }

    // Save to fallback storage
    try {
      setFallbackData(processedData.data, metadata);
    } catch (_error) {
      // Fallback storage failed, continue anyway
    }

    return NextResponse.json({
      success: true,
      data: processedData.data,
      metadata: metadata,
      message: `Successfully processed ${processedData.rowCount} rows`
    });

  } catch (_error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Upload failed' 
    });
  }
} 