import { NextResponse } from 'next/server';
import { supabase, CSV_BUCKET_NAME, CSV_FILE_NAME } from '@/lib/supabase';
import { getFallbackData, hasFallbackData } from '@/lib/fallback-storage';

export async function GET() {
  try {
    // Try Supabase first
    if (supabase) {
      try {
        const { data, error } = await supabase.storage
          .from(CSV_BUCKET_NAME)
          .download(CSV_FILE_NAME);

        if (!error && data) {
          const csvContent = await data.text();
          return new NextResponse(csvContent, {
            headers: {
              'Content-Type': 'text/csv',
              'Content-Disposition': `attachment; filename="${CSV_FILE_NAME}"`,
            },
          });
        }
      } catch (supabaseError) {
        // Supabase failed, use local fallback
      }
    }

    // Fallback to local storage
    if (hasFallbackData()) {
      const { csvData } = getFallbackData();
      
      // Convert data back to CSV
      const headers = Object.keys(csvData[0] || {});
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => 
          headers.map(header => {
            const value = row[header];
            return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
          }).join(',')
        )
      ].join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="local-${CSV_FILE_NAME}"`,
        },
      });
    }

    return NextResponse.json({
      success: false,
      error: 'CSV file not found'
    }, { status: 404 });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Download failed'
    }, { status: 500 });
  }
} 