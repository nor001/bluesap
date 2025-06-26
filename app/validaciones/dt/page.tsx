export default function ValidacionDTPage() {
  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
            📄 Validación DT
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
            Bienvenido al módulo de validación de Documentación Técnica (DT)
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              📋 ¿Qué es DT?
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              La Documentación Técnica (DT) contiene las especificaciones técnicas detalladas, 
              arquitectura del sistema, diagramas de flujo y detalles de implementación 
              para el desarrollo de soluciones SAP.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              ✅ Validaciones Disponibles
            </h3>
            <ul className="text-gray-600 dark:text-gray-400 space-y-2">
              <li>• Estructura de la documentación</li>
              <li>• Diagramas y flujos técnicos</li>
              <li>• Especificaciones de desarrollo</li>
              <li>• Validación de arquitectura</li>
            </ul>
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
          <h3 className="text-lg font-semibold mb-3 text-green-900 dark:text-green-100">
            🚀 Próximamente
          </h3>
          <p className="text-green-800 dark:text-green-200">
            Este módulo estará disponible próximamente. Aquí podrás revisar y validar 
            la documentación técnica de tus proyectos SAP con herramientas especializadas.
          </p>
        </div>
      </div>
    </div>
  );
} 