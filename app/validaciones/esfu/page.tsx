export default function ValidacionESFUPage() {
  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
            🧮 Validación ESFU
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
            Bienvenido al módulo de validación de Especificaciones Funcionales (ESFU)
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              📋 ¿Qué es ESFU?
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              La Especificación Funcional (ESFU) es un documento que describe detalladamente 
              los requerimientos funcionales de un sistema, incluyendo procesos, reglas de negocio 
              y flujos de trabajo.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              ✅ Validaciones Disponibles
            </h3>
            <ul className="text-gray-600 dark:text-gray-400 space-y-2">
              <li>• Completitud de requerimientos</li>
              <li>• Consistencia de reglas de negocio</li>
              <li>• Validación de flujos de proceso</li>
              <li>• Verificación de integraciones</li>
            </ul>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-semibold mb-3 text-blue-900 dark:text-blue-100">
            🚀 Próximamente
          </h3>
          <p className="text-blue-800 dark:text-blue-200">
            Este módulo estará disponible próximamente. Aquí podrás validar y revisar 
            las especificaciones funcionales de tus proyectos SAP de manera eficiente.
          </p>
        </div>
      </div>
    </div>
  );
} 