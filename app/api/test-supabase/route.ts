import { NextResponse } from 'next/server';
import { supabase, CSV_BUCKET_NAME } from '@/lib/supabase';

export async function GET() {
  try {
    if (!supabase) {
      return NextResponse.json({
        success: false,
        error: 'Supabase no está configurado',
        details: {
          hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Configurado' : 'No configurado',
          key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Configurado' : 'No configurado'
        }
      }, { status: 400 });
    }

    // Test 1: Check if we can connect to Supabase
    console.log('🧪 Probando conexión a Supabase...');
    
    // Test 2: Check if the bucket exists
    console.log('🏪 Verificando bucket:', CSV_BUCKET_NAME);
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error al listar buckets:', bucketsError);
      return NextResponse.json({
        success: false,
        error: 'Error al conectar con Supabase Storage',
        details: bucketsError
      }, { status: 500 });
    }

    console.log('📋 Buckets disponibles:', buckets?.map(b => b.name));
    
    const bucketExists = buckets?.some(bucket => bucket.name === CSV_BUCKET_NAME);
    console.log('✅ Bucket existe:', bucketExists);

    // Test 3: Try to list files in the bucket
    let filesInBucket: any[] = [];
    if (bucketExists) {
      const { data: files, error: filesError } = await supabase.storage
        .from(CSV_BUCKET_NAME)
        .list();

      if (filesError) {
        console.error('❌ Error al listar archivos:', filesError);
      } else {
        filesInBucket = files || [];
        console.log('📁 Archivos en bucket:', filesInBucket.map(f => f.name));
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Conexión a Supabase exitosa',
      details: {
        bucketExists,
        bucketName: CSV_BUCKET_NAME,
        filesInBucket: filesInBucket.length,
        fileNames: filesInBucket.map(f => f.name),
        availableBuckets: buckets?.map(b => b.name) || []
      }
    });

  } catch (error) {
    console.error('💥 Error inesperado en test de Supabase:', error);
    return NextResponse.json({
      success: false,
      error: 'Error inesperado',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 