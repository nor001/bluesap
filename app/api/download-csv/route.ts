import { NextResponse } from 'next/server';
import { supabase, CSV_BUCKET_NAME, CSV_FILE_NAME } from '@/lib/supabase';
import { getCSVAsBlob } from '@/lib/local-storage';

export async function GET() {
  try {
    let csvContent: string | null = null;
    let fileName = CSV_FILE_NAME;

    // Try to get from Supabase first
    if (supabase) {
      try {
        const { data, error } = await supabase.storage
          .from(CSV_BUCKET_NAME)
          .download(CSV_FILE_NAME);

        if (!error && data) {
          csvContent = await data.text();
        }
      } catch (supabaseError) {
      }
    }

    // Fallback to local storage
    if (!csvContent) {
      const blob = getCSVAsBlob();
      
      if (blob) {
        csvContent = await blob.text();
        fileName = 'central-local.csv';
      }
    }

    if (!csvContent) {
      return NextResponse.json({
        success: false,
        error: 'CSV file not found in Supabase Storage or local storage'
      }, { status: 404 });
    }

    // Return the CSV content
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Download failed'
    }, { status: 500 });
  }
} 