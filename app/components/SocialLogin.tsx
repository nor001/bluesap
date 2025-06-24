import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export function SocialLogin({ onSuccess }: { onSuccess?: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Lógica de login social
  const handleLogin = async (provider: 'google' | 'azure') => {
    setError(null);
    setLoading(true);
    if (!supabase) {
      setError('Supabase no está configurado.');
      setLoading(false);
      return;
    }
    const providerName = provider === 'azure' ? 'azure' : 'google';
    const { error } = await supabase.auth.signInWithOAuth({
      provider: providerName,
      options: {
        redirectTo: window.location.origin + '/auth/callback',
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
    // El flujo continúa en /auth/callback
  };

  return (
    <div className="w-full max-w-sm mx-auto mt-8">
      <h2 className="text-xl font-bold mb-4 text-center">Iniciar sesión</h2>
      <button
        className="w-full py-2 mb-3 bg-white border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50"
        onClick={() => handleLogin('google')}
        disabled={loading}
      >
        <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="h-5 w-5 mr-2" />
        Continuar con Google
      </button>
      <button
        className="w-full py-2 mb-3 bg-white border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50"
        onClick={() => handleLogin('azure')}
        disabled={loading}
      >
        <img src="https://www.svgrepo.com/show/303205/microsoft.svg" alt="Microsoft" className="h-5 w-5 mr-2" />
        Continuar con Microsoft
      </button>
      {error && <div className="text-red-600 text-sm mt-2 text-center">{error}</div>}
    </div>
  );
} 