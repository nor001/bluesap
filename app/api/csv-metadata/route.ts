import { NextResponse } from 'next/server';
import { getCSVMetadata } from '@/lib/supabase';
import { getFallbackData, hasFallbackData } from '@/lib/fallback-storage';

export async function GET() {
  try {
    // Try to get metadata from Supabase first
    let metadata = await getCSVMetadata();

    // If Supabase fails, try local fallback
    if (!metadata && hasFallbackData()) {
      const fallback = getFallbackData();
      const fallbackMetadata = fallback ? fallback.metadata : null;
      metadata = fallbackMetadata;
    }

    if (!metadata) {
      return NextResponse.json({
        success: false,
        error: 'No CSV metadata found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      metadata: metadata
    });

  } catch (error) {
    // Try local fallback on error
    if (hasFallbackData()) {
      const fallback = getFallbackData();
      const fallbackMetadata = fallback ? fallback.metadata : null;
      return NextResponse.json({
        success: true,
        metadata: fallbackMetadata
      });
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch metadata'
    }, { status: 500 });
  }
} 