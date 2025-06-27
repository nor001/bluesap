import { NextRequest, NextResponse } from 'next/server';
import { downloadFileFromSupabase, getCSVMetadata } from '@/lib/supabase';
import { getFallbackData } from '@/lib/fallback-storage';
import { convertToSimpleCSV } from '@/lib/csv-processor';

// Cache for CSV content to avoid repeated downloads
let csvCache: { content: string; timestamp: number } | null = null;
const CACHE_DURATION = process.env.NODE_ENV === 'development' 
  ? 30 * 60 * 1000  // 30 minutes in development
  : 5 * 60 * 1000;  // 5 minutes in production

// Function to clear cache (useful for testing or manual invalidation)
function clearCSVCache(): void {
  csvCache = null;
}

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
            metadata: metadata
          });
        } else {
          // Metadata missing file_size, create basic metadata
          const basicMetadata = {
            id: metadata?.id || 1,
            uploaded_at: metadata?.uploaded_at || new Date().toISOString(),
            file_size: csvContent.length,
            uploaded_by: metadata?.uploaded_by || 'unknown',
            row_count: metadata?.row_count || 0
          };
          
          return NextResponse.json({
            success: true,
            csvContent: csvContent,
            metadata: basicMetadata
          });
        }
      }
    } catch (_error) {
      // Supabase download failed, try fallback
    }
    
    // If Supabase failed, try fallback data
    const fallbackData = getFallbackData();
    
    if (fallbackData && fallbackData.csvData.length > 0) {
      // Convert data back to CSV format
      const csvContent = convertToSimpleCSV(fallbackData.csvData);
      
      // Get metadata for fallback
      const metadata = await getCSVMetadata();
      
      if (metadata && metadata.file_size) {
        return NextResponse.json({
          success: true,
          csvContent: csvContent,
          metadata: metadata
        });
      } else {
        // Create basic metadata for fallback
        const basicMetadata = {
          id: metadata?.id || 1,
          uploaded_at: metadata?.uploaded_at || new Date().toISOString(),
          file_size: csvContent.length,
          uploaded_by: metadata?.uploaded_by || 'fallback',
          row_count: fallbackData.csvData.length
        };
        
        return NextResponse.json({
          success: true,
          csvContent: csvContent,
          metadata: basicMetadata
        });
      }
    }
    
    // No data available
    return NextResponse.json({
      success: false,
      error: 'No CSV data available'
    });
    
  } catch (_error) {
    return NextResponse.json({
      success: false,
      error: 'Download failed'
    });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { action } = await request.json();
    
    if (action === 'clear-cache') {
      clearCSVCache();
      return NextResponse.json({
        success: true,
        message: 'CSV cache cleared successfully'
      });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 });
  } catch (_error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to process request'
    }, { status: 500 });
  }
} 