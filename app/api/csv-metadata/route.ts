import { NextResponse } from 'next/server';
import { getCSVMetadata } from '@/lib/supabase';
import { getFallbackData, hasFallbackData } from '@/lib/fallback-storage';

export async function GET() {
  try {
    // Try to get metadata from Supabase first
    try {
      const metadata = await getCSVMetadata();
      
      if (metadata) {
        return NextResponse.json({
          success: true,
          metadata: metadata
        });
      }
    } catch (error) {
      // Supabase failed, try fallback
    }
    
    // If Supabase failed, try fallback data
    const fallback = getFallbackData();
    
    if (fallback && fallback.metadata) {
      return NextResponse.json({
        success: true,
        metadata: fallback.metadata
      });
    }
    
    // No metadata available
    return NextResponse.json({
      success: false,
      error: 'No metadata available'
    });
    
  } catch (error) {
    // If error occurred, try fallback
    const fallback = getFallbackData();
    
    if (fallback && fallback.metadata) {
      return NextResponse.json({
        success: true,
        metadata: fallback.metadata
      });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve metadata'
    });
  }
} 