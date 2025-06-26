import { NextRequest, NextResponse } from 'next/server';
import { clearFallbackData } from '@/lib/fallback-storage';

export async function POST() {
  try {
    // Clear localStorage cache
    if (typeof window !== 'undefined') {
      localStorage.removeItem('bluesap-csv-cache');
    }
    
    // Clear fallback data
    clearFallbackData();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to clear cache' 
    });
  }
} 