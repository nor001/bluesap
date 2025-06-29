export default function DocumentacionPage() {
  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
            📚 Documentación
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
            Centro de recursos y documentación para el sistema SAP Project
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              📖 Guías de Usuario
            </h3>
            <ul className="text-gray-600 dark:text-gray-400 space-y-2">
              <li>• Manual de usuario del sistema</li>
              <li>• Guía de carga de datos CSV</li>
              <li>• Tutorial de asignación de recursos</li>
              <li>• Configuración de filtros y métricas</li>
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              🔧 Recursos Técnicos
            </h3>
            <ul className="text-gray-600 dark:text-gray-400 space-y-2">
              <li>• Especificaciones del sistema</li>
              <li>• API Documentation</li>
              <li>• Estructura de datos</li>
              <li>• Troubleshooting</li>
            </ul>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">
              🚀 Inicio Rápido
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Guía paso a paso para comenzar a usar el sistema
            </p>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <h4 className="font-semibold mb-2 text-green-900 dark:text-green-100">
              📊 Métricas
            </h4>
            <p className="text-sm text-green-800 dark:text-green-200">
              Explicación de las métricas y KPIs del sistema
            </p>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
            <h4 className="font-semibold mb-2 text-purple-900 dark:text-purple-100">
              🔍 FAQ
            </h4>
            <p className="text-sm text-purple-800 dark:text-purple-200">
              Preguntas frecuentes y soluciones comunes
            </p>
          </div>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <h3 className="text-lg font-semibold mb-3 text-yellow-900 dark:text-yellow-100">
            📝 En Desarrollo
          </h3>
          <p className="text-yellow-800 dark:text-yellow-200">
            Esta sección estará disponible próximamente con documentación
            completa, guías de usuario y recursos técnicos para optimizar el uso
            del sistema.
          </p>
        </div>
      </div>
    </div>
  );
}
