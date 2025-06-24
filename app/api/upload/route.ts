import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';
import { UploadResponse } from '@/lib/types';

export async function POST(request: NextRequest): Promise<NextResponse<UploadResponse>> {
  try {
    const formData = await request.formData();
    const file = formData.get('csv') as File;

    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'No file provided'
      }, { status: 400 });
    }

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      return NextResponse.json({
        success: false,
        error: 'File must be a CSV'
      }, { status: 400 });
    }

    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({
        success: false,
        error: 'File size must be less than 50MB'
      }, { status: 400 });
    }

    // Read file content
    const text = await file.text();
    
    // Split text into lines and skip first 2 lines
    const lines = text.split('\n');
    if (lines.length < 3) {
      return NextResponse.json({
        success: false,
        error: 'CSV file must have at least 3 lines'
      }, { status: 400 });
    }
    
    // Remove first 2 lines and join the rest
    const csvContent = lines.slice(2).join('\n');
    
    // Parse CSV with Papa Parse using the 3rd line as header
    const result = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      transform: (value) => value.trim(),
    });

    if (result.errors.length > 0) {
      return NextResponse.json({
        success: false,
        error: `CSV parsing errors: ${result.errors.map(e => e.message).join(', ')}`
      }, { status: 400 });
    }

    // Clean and validate data
    const data = result.data as any[];
    
    // Remove rows where PROY is empty or contains non-data values
    const cleanedData = data.filter(row => 
      row.PROY && 
      row.PROY !== '' && 
      row.PROY !== 'PROY' &&
      row.PROY !== 'nan'
    );

    // Normalize date columns
    const normalizedData = cleanedData.map(row => {
      const normalizedRow = { ...row };
      
      // Normalize date columns
      const dateColumns = [
        'esfu_disponible',
        'plan_abap_dev_ini',
        'Fecha Inicio Plan',
        'Fecha Fin Plan',
        'available_test_date',
        'plan_abap_pu_ini',
        'pu_ini',
        'Fecha Fin Real'
      ];

      dateColumns.forEach(col => {
        if (row[col]) {
          try {
            // Handle dd/mm/yyyy format
            const date = new Date(row[col]);
            if (!isNaN(date.getTime())) {
              normalizedRow[col] = date.toISOString();
            }
          } catch (e) {
            // Keep original value if parsing fails
          }
        }
      });

      // Normalize numeric columns
      const numericColumns = ['plan_abap_dev_time', 'plan_abap_pu_time'];
      numericColumns.forEach(col => {
        if (row[col]) {
          const num = parseFloat(row[col]);
          if (!isNaN(num)) {
            normalizedRow[col] = num;
          }
        }
      });

      return normalizedRow;
    });

    return NextResponse.json({
      success: true,
      data: normalizedData,
      message: `Successfully uploaded ${normalizedData.length} rows (header from line 3)`
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    }, { status: 500 });
  }
} 