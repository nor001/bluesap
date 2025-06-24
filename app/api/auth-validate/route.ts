import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 [auth-validate] Iniciando validación...');
    
    if (!supabase) {
      console.log('❌ [auth-validate] Supabase no configurado');
      return NextResponse.json({ success: false, error: 'Supabase no configurado' }, { status: 500 });
    }
    
    const { email } = await request.json();
    console.log('📧 [auth-validate] Email recibido:', email);
    
    if (!email) {
      console.log('❌ [auth-validate] Email requerido');
      return NextResponse.json({ success: false, error: 'Email requerido' }, { status: 400 });
    }
    
    console.log('🔍 [auth-validate] Consultando tabla invited_users...');
    const { data, error } = await supabase
      .from('invited_users')
      .select('email')
      .eq('email', email)
      .single();
    
    console.log('📊 [auth-validate] Resultado de consulta:', { data, error });
    
    if (error) {
      console.log('❌ [auth-validate] Error en consulta:', error);
    }
    
    if (error || !data) {
      console.log('❌ [auth-validate] Usuario no autorizado - email no encontrado');
      return NextResponse.json({ success: false, error: 'No autorizado: correo no invitado' }, { status: 403 });
    }
    
    console.log('✅ [auth-validate] Usuario autorizado:', data);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.log('💥 [auth-validate] Error inesperado:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Error desconocido' }, { status: 500 });
  }
} 