"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function validateUser() {
      setLoading(true);
      setError(null);
      if (!supabase) {
        setError('Supabase no está configurado.');
        setLoading(false);
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user || !user.email) {
        setError('No se pudo obtener el usuario autenticado.');
        setLoading(false);
        return;
      }
      
      const res = await fetch('/api/auth-validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      });
      
      if (res.ok) {
        router.replace('/');
      } else {
        await supabase.auth.signOut();
        setError('Tu correo no está invitado. Solicita acceso al administrador.');
        setLoading(false);
      }
    }
    validateUser();
  }, [router]);

  return (
    <div className="w-full max-w-sm mx-auto mt-16 text-center">
      {loading ? (
        <div className="text-lg">Validando acceso...</div>
      ) : error ? (
        <div className="text-red-600 text-lg">{error}</div>
      ) : null}
    </div>
  );
} 