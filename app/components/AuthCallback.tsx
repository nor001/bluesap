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
      
      // Logs de debug para diagnosticar el problema
      console.log('🔍 Usuario autenticado:', user);
      console.log('📧 Email del usuario:', user?.email);
      
      if (!user || !user.email) {
        setError('No se pudo obtener el usuario autenticado.');
        setLoading(false);
        return;
      }
      
      // Log antes de la validación
      console.log('🔍 Validando email:', user.email);
      
      // Validar contra la API
      const res = await fetch('/api/auth-validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      });
      
      // Log del resultado de la validación
      console.log('🔍 Resultado de validación:', res.status, res.statusText);
      
      if (res.ok) {
        // Usuario invitado, redirigir a la app
        console.log('✅ Usuario autorizado, redirigiendo...');
        router.replace('/');
      } else {
        // No invitado, cerrar sesión y mostrar error
        console.log('❌ Usuario no autorizado, cerrando sesión...');
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