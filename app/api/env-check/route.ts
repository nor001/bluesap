import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    // Check if Supabase is configured
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: 'Supabase not configured',
        details: {
          hasUrl: !!supabaseUrl,
          hasServiceKey: !!supabaseServiceKey
        }
      });
    }

    // Try to connect to Supabase and check the csv_metadata table
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    try {
      const { data, error } = await supabase
        .from('csv_metadata')
        .select('*')
        .limit(5);

      if (error) {
        return NextResponse.json({
          success: false,
          error: 'Failed to connect to Supabase',
          details: error
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Supabase connection successful',
        data: data,
        tableStructure: {
          tableName: 'csv_metadata',
          recordCount: data?.length || 0
        }
      });
    } catch (_error) {
      return NextResponse.json({
        success: false,
        error: 'Supabase query failed',
        details: 'Query execution error'
      });
    }
  } catch (_error) {
    return NextResponse.json({
      success: false,
      error: 'Environment check failed',
      details: 'Environment validation error'
    });
  }
} 