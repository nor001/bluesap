import { NextResponse } from 'next/server';
import { supabase, CSV_BUCKET_NAME } from '@/lib/supabase';

export async function GET() {
  try {
    // Check environment variables first
    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!hasUrl || !hasKey) {
      return NextResponse.json({
        success: false,
        error: 'Supabase no está configurado',
        details: {
          hasUrl,
          hasKey,
          hasServiceKey,
          url: hasUrl ? 'Configurado' : 'No configurado',
          key: hasKey ? 'Configurado' : 'No configurado',
          serviceKey: hasServiceKey ? 'Configurado' : 'No configurado',
          instructions: [
            '1. Copia el archivo env.example como .env.local',
            '2. Reemplaza las credenciales con tus valores reales de Supabase',
            '3. Reinicia el servidor de desarrollo'
          ]
        }
      }, { status: 400 });
    }

    if (!supabase) {
      return NextResponse.json({
        success: false,
        error: 'Error al crear cliente de Supabase',
        details: {
          hasUrl,
          hasKey,
          hasServiceKey,
          url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + '...',
          key: hasKey ? 'Configurado' : 'No configurado'
        }
      }, { status: 500 });
    }

    // Test 1: Check if we can connect to Supabase
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      return NextResponse.json({
        success: false,
        error: 'Error al conectar con Supabase Storage',
        details: {
          error: bucketsError.message,
          hint: 'Verifica tu conexión a internet y configuración de proxy'
        }
      }, { status: 500 });
    }

    const bucketExists = buckets?.some(bucket => bucket.name === CSV_BUCKET_NAME);

    // Test 2: Try to list files in the bucket
    let filesInBucket: any[] = [];
    if (bucketExists) {
      const { data: files, error: filesError } = await supabase.storage
        .from(CSV_BUCKET_NAME)
        .list();

      if (filesError) {
        return NextResponse.json({
          success: false,
          error: 'Error al acceder al bucket de almacenamiento',
          details: {
            bucketExists,
            bucketName: CSV_BUCKET_NAME,
            error: filesError.message
          }
        }, { status: 500 });
      } else {
        filesInBucket = files || [];
      }
    }

    // Test 3: Check database connection
    const { data: dbTest, error: dbError } = await supabase
      .from('csv_metadata')
      .select('count')
      .limit(1);

    return NextResponse.json({
      success: true,
      message: 'Conexión a Supabase exitosa',
      details: {
        bucketExists,
        bucketName: CSV_BUCKET_NAME,
        filesInBucket: filesInBucket.length,
        fileNames: filesInBucket.map(f => f.name),
        availableBuckets: buckets?.map(b => b.name) || [],
        databaseConnection: dbError ? 'Error' : 'OK',
        databaseError: dbError?.message
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Error inesperado',
      details: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.stack : undefined : undefined
      }
    }, { status: 500 });
  }
} 