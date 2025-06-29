import { logError } from '@/lib/error-handler';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @ai-context API endpoint para procesar datos CSV ya parseados
 * @ai-purpose Recibe datos CSV procesados del frontend y los valida/transforma
 * @ai-data-expects JSON con array de objetos de datos de proyectos SAP
 * @ai-business-context Validación y procesamiento de datos de planificación SAP
 * @ai-special-cases Maneja diferentes formatos de datos y validaciones corporativas
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data } = body;

    // Validate input data structure
    if (!Array.isArray(data)) {
      return NextResponse.json(
        { success: false, error: 'Invalid data format. Expected array of objects.' },
        { status: 400 }
      );
    }

    if (data.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No data provided.' },
        { status: 400 }
      );
    }

    // Validate SAP project data structure
    const validateSAPProjectData = (data: any[]): void => {
      const requiredColumns = ['fecha_inicio', 'fecha_fin', 'responsable', 'duracion'];
      const firstRow = data[0];
      
      if (!firstRow || typeof firstRow !== 'object') {
        throw new Error('Invalid data structure. Expected object with project data.');
      }

      const missingColumns = requiredColumns.filter(col => !(col in firstRow));
      
      if (missingColumns.length > 0) {
        throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
      }
    };

    validateSAPProjectData(data);

    // Simple data processing - normalize dates and numbers
    const processSAPProjectData = (data: any[]): any[] => {
      return data.map(row => {
        const processedRow = { ...row };

        // Normalize date columns
        const dateColumns = ['fecha_inicio', 'fecha_fin'];
        dateColumns.forEach(col => {
          if (row[col]) {
            try {
              const date = new Date(row[col] as string);
              if (!isNaN(date.getTime())) {
                processedRow[col] = date.toISOString();
              }
            } catch {
              // Keep original value if date parsing fails
            }
          }
        });

        // Normalize numeric columns
        const numericColumns = ['duracion'];
        numericColumns.forEach(col => {
          if (row[col]) {
            const num = parseFloat(row[col] as string);
            if (!isNaN(num)) {
              processedRow[col] = num;
            }
          }
        });

        return processedRow;
      });
    };

    const processedData = processSAPProjectData(data);

    // Return processed data
    return NextResponse.json({
      success: true,
      data: processedData,
      message: `Successfully processed ${processedData.length} SAP project records`
    });

  } catch (error) {
    console.error('Error processing parsed CSV data:', error);
    
    logError(
      {
        type: 'processing',
        message: 'Failed to process parsed CSV data',
        details: error,
        timestamp: Date.now(),
        userFriendly: true,
      },
      'upload-parsed'
    );

    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
} 