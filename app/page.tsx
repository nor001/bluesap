'use client';

import { CSVUpload } from '@/components/CSVUpload';
import { Filters } from '@/components/Filters';
import { Metrics } from '@/components/Metrics';
import Sidebar from '@/components/Sidebar';
import { Timeline } from '@/components/Timeline';
import { useAppStore } from '@/lib/store';
import { useEffect, useState } from 'react';
import { CSV_COLUMNS } from '@/lib/types/csv-columns';

/**
 * Main application page for SAP project management
 * Handles data loading, resource assignment, and timeline visualization
 * Special cases: Fallback data loading, cache management, and Supabase synchronization
 */
export default function HomePage() {
  const {
    csvData,
    assignedData,
    filters,
    loading,
    planType,
    csvMetadata,
    assignResources,
    updateFilters,
    fetchCSVMetadata,
    loadCachedData,
    loadFallbackData,
  } = useAppStore();

  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize application data
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Try to load cached data first
        const cachedLoaded = loadCachedData();
        
        if (!cachedLoaded) {
          // Fallback to stored data if cache is empty
          loadFallbackData();
        }

        // Fetch metadata for display
        await fetchCSVMetadata();
        
        setIsInitialized(true);
      } catch (_error) {
        // Silently fail - initialization is optional
        setIsInitialized(true);
      }
    };

    initializeApp();
  }, [loadCachedData, loadFallbackData, fetchCSVMetadata]);

  // Auto-assign resources when data changes
  useEffect(() => {
    if (csvData && csvData.length > 0 && isInitialized) {
      const timer = setTimeout(() => {
        assignResources();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [csvData, isInitialized, assignResources]);

  // Get plan configuration for timeline
  const getPlanConfig = () => {
    const configs = {
      'Plan de Desarrollo': {
        start_date_col: CSV_COLUMNS.PLANNED_ABAP_DEV_START,
        end_date_col: CSV_COLUMNS.PLANNED_ABAP_DEV_END,
        resource_col: CSV_COLUMNS.ABAP_ASSIGNED,
        hours_col: CSV_COLUMNS.ABAP_DEVELOPMENT_TIME,
        resource_title: 'ABAP Developer',
        resources_title: 'ABAP Developers',
        assigned_title: 'Asignado',
        available_date_col: CSV_COLUMNS.EFFORT_READY_DATE,
        plan_date_col: CSV_COLUMNS.PLANNED_ABAP_DEV_START,
        use_group_based_assignment: false,
        module_col: CSV_COLUMNS.MODULE,
        project_col: CSV_COLUMNS.PROJECT,
      },
      'Plan de PU': {
        start_date_col: CSV_COLUMNS.PLANNED_ABAP_DEV_START,
        end_date_col: CSV_COLUMNS.PLANNED_ABAP_DEV_END,
        resource_col: CSV_COLUMNS.ABAP_ASSIGNED,
        hours_col: CSV_COLUMNS.ABAP_TEST_TIME,
        resource_title: 'ABAP PU',
        resources_title: 'ABAP PUs',
        assigned_title: 'Asignado',
        available_date_col: CSV_COLUMNS.EFFORT_READY_DATE,
        plan_date_col: CSV_COLUMNS.PLANNED_ABAP_DEV_START,
        use_group_based_assignment: false,
        module_col: CSV_COLUMNS.MODULE,
        project_col: CSV_COLUMNS.PROJECT,
      },
      'Plan de Test': {
        start_date_col: CSV_COLUMNS.PLANNED_ABAP_DEV_START,
        end_date_col: CSV_COLUMNS.PLANNED_ABAP_DEV_END,
        resource_col: CSV_COLUMNS.ABAP_ASSIGNED,
        hours_col: CSV_COLUMNS.ABAP_TEST_TIME,
        resource_title: 'ABAP Test',
        resources_title: 'ABAP Testers',
        assigned_title: 'Asignado',
        available_date_col: CSV_COLUMNS.EFFORT_READY_DATE,
        plan_date_col: CSV_COLUMNS.PLANNED_ABAP_DEV_START,
        use_group_based_assignment: false,
        module_col: CSV_COLUMNS.MODULE,
        project_col: CSV_COLUMNS.PROJECT,
      },
    };

    return configs[planType as keyof typeof configs] || configs['Plan de Desarrollo'];
  };

  // Filter data based on current filters
  const getFilteredData = () => {
    if (!assignedData || assignedData.length === 0) {
      return [];
    }

    return assignedData.filter((item: Record<string, unknown>) => {
      const project = String(item[CSV_COLUMNS.PROJECT] || '');
      const moduleName = String(item[CSV_COLUMNS.MODULE] || '');
      const group = String(item[CSV_COLUMNS.GROUP] || '');
      const id = String(item[CSV_COLUMNS.ID] || '');
      const consultant = String(item[CSV_COLUMNS.FUNCTIONAL_ASSIGNED] || '');

      const projectMatch = filters.selectedProject === 'Todos' || project === filters.selectedProject;
      const moduleMatch = filters.selectedModule === 'Todos' || moduleName === filters.selectedModule;
      const groupMatch = filters.selectedGroup === 'Todos' || group === filters.selectedGroup;
      const idMatch = !filters.idFilter || id.includes(filters.idFilter);
      const consultantMatch = filters.functionalAssigned === 'Todos' || consultant === filters.functionalAssigned;

      return projectMatch && moduleMatch && groupMatch && idMatch && consultantMatch;
    });
  };

  const filteredData = getFilteredData();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Gestión de Proyectos SAP
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Planificación y asignación de recursos ABAP
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  {csvMetadata && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      <span>Última actualización: </span>
                      <span className="font-medium">
                        {new Date(csvMetadata.uploaded_at).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Upload Section */}
            <CSVUpload />

            {/* Metrics */}
            {csvData && csvData.length > 0 && (
              <Metrics 
                data={filteredData} 
                planConfig={getPlanConfig()}
              />
            )}

            {/* Filters and Timeline */}
            {assignedData && assignedData.length > 0 && (
              <>
                <Filters
                  data={assignedData}
                  onFilterChange={updateFilters}
                />

                <Timeline
                  data={filteredData}
                  planConfig={getPlanConfig()}
                />
              </>
            )}

            {/* Loading State */}
            {loading && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600 dark:text-gray-400">
                    Procesando datos...
                  </span>
                </div>
              </div>
            )}

            {/* No Data State */}
            {!loading && (!csvData || (Array.isArray(csvData) && csvData.length === 0)) && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12">
                <div className="text-center">
                  <div className="text-6xl mb-4">📊</div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Bienvenido a la Gestión de Proyectos SAP
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Sube un archivo CSV con datos de proyectos para comenzar
                  </p>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    <p>Formatos soportados: CSV con datos de proyectos SAP</p>
                    <p>Columnas esperadas: project, module, group, abapDevelopmentTime, etc.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
