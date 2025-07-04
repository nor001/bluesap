'use client';
import { isSupabaseAvailable, supabaseClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ERROR_MESSAGES } from '../lib/types/error-messages';

export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function validateUser() {
      setLoading(true);
      setError(null);

      if (!isSupabaseAvailable()) {
        setError(ERROR_MESSAGES.CONFIG_ERROR);
        setLoading(false);
        return;
      }

      try {
        const {
          data: { user },
          error: userError,
        } = await supabaseClient!.auth.getUser();

        if (userError) {
          setError(`${ERROR_MESSAGES.USER_ERROR}: ${userError.message}`);
          setLoading(false);
          return;
        }

        if (!user || !user.email) {
          setError(ERROR_MESSAGES.USER_NOT_FOUND);
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
            ERROR_MESSAGES.NOT_INVITED;

          await supabaseClient!.auth.signOut();
          setError(errorMsg);
          setLoading(false);
        }
      } catch (error) {
        setError(
          `${ERROR_MESSAGES.VALIDATION_ERROR}: ${error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR}`
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
