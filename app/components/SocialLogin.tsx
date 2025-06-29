import { useState } from 'react';
import { supabaseClient, isSupabaseAvailable } from '@/lib/supabase-client';

export function SocialLogin() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Lógica de login social
  const handleLogin = async () => {
    setError(null);
    setLoading(true);

    try {
      // Verificar si Supabase está disponible
      if (!isSupabaseAvailable()) {
        setError(
          'Error de configuración. Por favor, contacta al administrador.'
        );
        setLoading(false);
        return;
      }

      const { data, error } = await supabaseClient!.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/auth/callback',
        },
      });

      if (error) {
        setError(error.message);
        setLoading(false);
      } else if (data?.url) {
        // Redirigir al usuario a la URL de OAuth
        window.location.href = data.url;
      } else {
        setError('No se pudo iniciar el proceso de autenticación');
        setLoading(false);
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Error desconocido durante el login'
      );
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto mt-8">
      <h2 className="text-xl font-bold mb-4 text-center">Iniciar sesión</h2>

      <button
        className={`w-full py-2 mb-3 bg-white border border-gray-300 rounded flex items-center justify-center transition-colors ${
          loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
        }`}
        onClick={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
            Conectando...
          </>
        ) : (
          <>
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              className="h-5 w-5 mr-2"
            />
            Continuar con Google
          </>
        )}
      </button>

      {error && (
        <div className="text-red-600 text-sm mt-2 text-center p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
          {error}
        </div>
      )}
    </div>
  );
}
