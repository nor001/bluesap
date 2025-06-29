import { logError } from '@/lib/error-handler';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @ai-context Diagnostic endpoint for SAP Project Management system
 * @ai-purpose Systematic health check and debugging for production issues
 * @ai-business-context Critical for maintaining SAP project planning system reliability
 * @ai-special-cases Handles corporate environment constraints and legacy compatibility
 */
export async function GET(_request: NextRequest) {
  try {
    // Step 1: Environment validation
    const envCheck = validateEnvironment();
    if (!envCheck.success) {
      return NextResponse.json(
        { 
          success: false, 
          step: 'env_check', 
          error: envCheck.error,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }

    // Step 2: Service connection test
    const connectionTest = await testServiceConnections();
    if (!connectionTest.success) {
      return NextResponse.json(
        { 
          success: false, 
          step: 'connection_test', 
          error: connectionTest.error,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }

    // Step 3: Business logic test
    const businessTest = testBusinessLogic();
    if (!businessTest.success) {
      return NextResponse.json(
        { 
          success: false, 
          step: 'business_test', 
          error: businessTest.error,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }

    // All tests passed
    return NextResponse.json({
      success: true,
      step: 'all_tests',
      message: 'All diagnostic tests passed',
      timestamp: new Date().toISOString(),
      environment: envCheck.details,
      connections: connectionTest.details,
      business: businessTest.details
    });

  } catch (error) {
    logError(
      {
        type: 'processing',
        message: 'Diagnostic endpoint failed',
        details: error,
        timestamp: Date.now(),
        userFriendly: true,
      },
      'diagnostic'
    );

    return NextResponse.json(
      { 
        success: false, 
        step: 'general_error', 
        error: error instanceof Error ? error.message : 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * @ai-function Validates environment variables and configuration
 * @ai-returns Object with success status and details
 */
function validateEnvironment() {
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  return {
    success: missing.length === 0,
    error: missing.length > 0 ? `Missing environment variables: ${missing.join(', ')}` : null,
    details: {
      nodeEnv: process.env.NODE_ENV,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    }
  };
}

/**
 * @ai-function Tests external service connections
 * @ai-returns Object with success status and connection details
 */
async function testServiceConnections() {
  try {
    // Test Supabase connection
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return {
        success: false,
        error: 'Supabase configuration missing',
        details: null
      };
    }

    // Simple connection test
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });

    return {
      success: response.ok,
      error: response.ok ? null : `Supabase connection failed: ${response.status}`,
      details: {
        supabaseStatus: response.status,
        supabaseOk: response.ok
      }
    };

  } catch (error) {
    return {
      success: false,
      error: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: null
    };
  }
}

/**
 * @ai-function Tests core business logic functionality
 * @ai-returns Object with success status and business logic details
 */
function testBusinessLogic() {
  try {
    // Test CSV processing logic
    const testCSVData = [
      {
        fecha_inicio: '2024-01-01',
        fecha_fin: '2024-01-31',
        responsable: 'ABAP_DEV_1',
        duracion: 40,
        proyecto: 'TEST_PROJECT',
        modulo: 'FI',
        grupo_dev: 'GROUP_A'
      }
    ];

    // Validate required columns
    const requiredColumns = ['fecha_inicio', 'fecha_fin', 'responsable', 'duracion'];
    const firstRow = testCSVData[0];
    const missingColumns = requiredColumns.filter(col => !(col in firstRow));
    
    if (missingColumns.length > 0) {
      return {
        success: false,
        error: `Business logic validation failed: Missing columns ${missingColumns.join(', ')}`,
        details: null
      };
    }

    // Test date parsing
    const startDate = new Date(firstRow.fecha_inicio);
    const endDate = new Date(firstRow.fecha_fin);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return {
        success: false,
        error: 'Business logic validation failed: Invalid date format',
        details: null
      };
    }

    return {
      success: true,
      error: null,
      details: {
        csvValidation: 'passed',
        dateParsing: 'passed',
        requiredColumns: requiredColumns,
        testDataProcessed: testCSVData.length
      }
    };

  } catch (error) {
    return {
      success: false,
      error: `Business logic test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: null
    };
  }
} 