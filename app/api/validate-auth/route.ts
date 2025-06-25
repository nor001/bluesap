import { NextResponse } from 'next/server';

export async function GET() {
  const envVars = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  };

  const isFrontendConfigured = envVars.NEXT_PUBLIC_SUPABASE_URL && envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isBackendConfigured = envVars.SUPABASE_URL && envVars.SUPABASE_SERVICE_ROLE_KEY;

  return NextResponse.json({
    success: true,
    configured: isFrontendConfigured,
    frontend: isFrontendConfigured,
    backend: isBackendConfigured,
    variables: envVars,
    timestamp: new Date().toISOString(),
    recommendations: [
      isFrontendConfigured ? '✅ Frontend configurado correctamente' : '❌ Falta NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY',
      isBackendConfigured ? '✅ Backend configurado correctamente' : '❌ Falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY',
    ]
  });
} 