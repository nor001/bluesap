'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient, isSupabaseAvailable } from '@/lib/supabase-client';

export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function validateUser() {
      setLoading(true);
      setError(null);

      if (!isSupabaseAvailable()) {
        setError(
          'Error de configuración. Por favor, contacta al administrador.'
        );
        setLoading(false);
        return;
      }

      try {
        const {
          data: { user },
          error: userError,
        } = await supabaseClient!.auth.getUser();

        if (userError) {
          setError(`Error obteniendo usuario: ${userError.message}`);
          setLoading(false);
          return;
        }

        if (!user || !user.email) {
          setError('No se pudo obtener el usuario autenticado.');
          setLoading(false);
          return;
        }

        const res = await fetch('/api/auth-validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email }),
        });

        if (res.ok) {
          router.replace('/');
        } else {
          const errorData = await res.json().catch(() => ({}));
          const errorMsg =
            errorData.error ||
            'Tu correo no está invitado. Solicita acceso al administrador.';

          await supabaseClient!.auth.signOut();
          setError(errorMsg);
          setLoading(false);
        }
      } catch (error) {
        setError(
          `Error durante la validación: ${error instanceof Error ? error.message : 'Error desconocido'}`
        );
        setLoading(false);
      }
    }

    validateUser();
  }, [router]);

  return (
    <div className="w-full max-w-sm mx-auto mt-16 text-center">
      {loading ? (
        <div className="text-lg mb-4">Validando acceso...</div>
      ) : error ? (
        <div className="text-red-600 text-lg mb-4">{error}</div>
      ) : null}
    </div>
  );
}
