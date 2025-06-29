import { NextRequest, NextResponse } from 'next/server';
import { downloadFileFromSupabase, getCSVMetadata } from '@/lib/supabase';
import { getFallbackData } from '@/lib/fallback-storage';
import { convertToSimpleCSV } from '@/lib/csv-processor';

export async function GET() {
  try {
    // Try to download from Supabase first
    try {
      const csvContent = await downloadFileFromSupabase();

      if (csvContent) {
        // Get metadata from database
        const metadata = await getCSVMetadata();

        if (metadata && metadata.file_size) {
          return NextResponse.json({
            success: true,
            csvContent: csvContent,
            metadata: metadata,
          });
        } else {
          // Metadata missing file_size, create basic metadata
          const basicMetadata = {
            id: metadata?.id || 1,
            uploaded_at: metadata?.uploaded_at || new Date().toISOString(),
            file_size: Buffer.byteLength(csvContent, 'utf8'),
            uploaded_by: metadata?.uploaded_by || 'system',
            row_count: csvContent.split('\n').length - 1,
          };

          return NextResponse.json({
            success: true,
            csvContent: csvContent,
            metadata: basicMetadata,
          });
        }
      }
    } catch {
      // Supabase failed, try fallback
    }

    // If Supabase failed, try fallback data
    const fallback = getFallbackData();

    if (fallback && fallback.csvData && fallback.csvData.length > 0) {
      try {
        const csvContent = convertToSimpleCSV(fallback.csvData);

        return NextResponse.json({
          success: true,
          csvContent: csvContent,
          metadata: fallback.metadata,
        });
      } catch {
        // CSV conversion failed
      }
    }

    // No data available
    return NextResponse.json({
      success: false,
      error: 'No CSV data available',
    });
  } catch {
    return NextResponse.json({
      success: false,
      error: 'Failed to download CSV',
    });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { action } = await request.json();

    if (action === 'clear-cache') {
      // Implement cache clearing logic here
      return NextResponse.json({
        success: true,
        message: 'CSV cache clearing logic not implemented',
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Invalid action',
      },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process request',
      },
      { status: 500 }
    );
  }
}
