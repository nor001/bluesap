import { NextRequest, NextResponse } from 'next/server';
import { downloadFileFromSupabase } from '@/lib/supabase';
import { getFallbackData } from '@/lib/fallback-storage';
import { convertToSimpleCSV } from '@/lib/csv-processor';
import { handleSupabaseError, logError } from '@/lib/error-handler';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Try to download from Supabase first
    let csvContent: string | null = null;
    
    try {
      csvContent = await downloadFileFromSupabase();
    } catch (supabaseError) {
      // Supabase failed, try fallback storage
      const error = handleSupabaseError(supabaseError);
      logError(error, 'Download CSV API - Supabase Fallback');
    }

    // If Supabase failed, use fallback storage
    if (!csvContent) {
      const fallbackData = getFallbackData();
      
      if (fallbackData && fallbackData.csvData.length > 0) {
        // Convert to simple CSV format for download
        csvContent = convertToSimpleCSV(fallbackData.csvData);
      }
    }

    if (!csvContent) {
      return NextResponse.json({
        success: false,
        error: 'No CSV data available'
      }, { status: 404 });
    }

    // Return CSV content
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="sap_project_data.csv"'
      }
    });

  } catch (error) {
    logError({
      type: 'processing',
      message: 'Failed to download CSV',
      details: error,
      timestamp: Date.now(),
      userFriendly: false
    }, 'Download CSV API');
    
    return NextResponse.json({
      success: false,
      error: 'Failed to download CSV'
    }, { status: 500 });
  }
} 