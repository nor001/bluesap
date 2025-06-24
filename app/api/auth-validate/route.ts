import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Supabase no configurado' }, { status: 500 });
    }
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ success: false, error: 'Email requerido' }, { status: 400 });
    }
    const { data, error } = await supabase
      .from('invited_users')
      .select('email')
      .eq('email', email)
      .single();
    if (error || !data) {
      return NextResponse.json({ success: false, error: 'No autorizado: correo no invitado' }, { status: 403 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Error desconocido' }, { status: 500 });
  }
} 