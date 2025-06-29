export default function ConfiguracionPage() {
  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
            ⚙️ Configuración
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
            Panel de configuración y ajustes del sistema SAP Project
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              👤 Perfil de Usuario
            </h3>
            <ul className="text-gray-600 dark:text-gray-400 space-y-2">
              <li>• Información personal</li>
              <li>• Preferencias de notificación</li>
              <li>• Configuración de idioma</li>
              <li>• Zona horaria</li>
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              🔧 Configuración del Sistema
            </h3>
            <ul className="text-gray-600 dark:text-gray-400 space-y-2">
              <li>• Configuración de Supabase</li>
              <li>• Gestión de archivos CSV</li>
              <li>• Configuración de métricas</li>
              <li>• Backup y sincronización</li>
            </ul>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">
              🎨 Apariencia
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Configurar tema, colores y diseño visual
            </p>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <h4 className="font-semibold mb-2 text-green-900 dark:text-green-100">
              🔔 Notificaciones
            </h4>
            <p className="text-sm text-green-800 dark:text-green-200">
              Configurar alertas y notificaciones del sistema
            </p>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
            <h4 className="font-semibold mb-2 text-purple-900 dark:text-purple-100">
              🔐 Seguridad
            </h4>
            <p className="text-sm text-purple-800 dark:text-purple-200">
              Configuración de autenticación y permisos
            </p>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
            📊 Información del Sistema
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div>
              <p>
                <strong>Versión:</strong> 1.0.0
              </p>
              <p>
                <strong>Última actualización:</strong> 25 de junio, 2025
              </p>
            </div>
            <div>
              <p>
                <strong>Estado:</strong>{' '}
                <span className="text-green-600">Operativo</span>
              </p>
              <p>
                <strong>Base de datos:</strong> Supabase
              </p>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-lg border border-orange-200 dark:border-orange-800 mt-6">
          <h3 className="text-lg font-semibold mb-3 text-orange-900 dark:text-orange-100">
            🚧 En Desarrollo
          </h3>
          <p className="text-orange-800 dark:text-orange-200">
            El panel de configuración completo estará disponible próximamente
            con todas las opciones de personalización y ajustes del sistema.
          </p>
        </div>
      </div>
    </div>
  );
}
