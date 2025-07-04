import { supabase } from '@/lib/supabase';
import { ERROR_MESSAGES } from '@/lib/types/error-messages';
import { STATUS_CODES } from '@/lib/types/status-codes';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Supabase no configurado' },
        { status: STATUS_CODES.INTERNAL_SERVER_ERROR }
      );
    }

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email requerido' },
        { status: STATUS_CODES.BAD_REQUEST }
      );
    }

    const { data, error } = await supabase
      .from('invited_users')
      .select('email')
      .eq('email', email)
      .single();

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR,
        },
        { status: STATUS_CODES.INTERNAL_SERVER_ERROR }
      );
    }

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: 'No autorizado: correo no invitado' },
        { status: STATUS_CODES.FORBIDDEN }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR,
      },
      { status: STATUS_CODES.INTERNAL_SERVER_ERROR }
    );
  }
}
