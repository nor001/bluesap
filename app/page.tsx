'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import Timeline from '@/components/Timeline';
import { Metrics } from '@/components/Metrics';
import { Filters } from '@/components/Filters';
import { CSVUpload } from '@/components/CSVUpload';
import { TestComponent } from '@/components/TestComponent';
import { SupabaseStatus } from '@/components/SupabaseStatus';
import { useAppStore } from '@/lib/store';

export default function Home() {
  const {
    csvData,
    assignedData,
    filters,
    uploadCSV,
    assignResources,
    updateFilters,
    fetchCSVMetadata,
    loadFallbackData,
    loadCachedData
  } = useAppStore();

  // State for UI
  const [currentView, setCurrentView] = useState<'timeline' | 'metrics' | 'upload' | 'test'>('timeline');
  const [showSidebar] = useState(true);

  // Load data on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      // Try to load from cache first
      const cached = loadCachedData();
      
      if (!cached) {
        // Try to load from fallback storage
        loadFallbackData();
      }
      
      // Always try to fetch fresh metadata
      await fetchCSVMetadata();
    };

    loadInitialData();
  }, [loadCachedData, loadFallbackData, fetchCSVMetadata]);

  // Auto-assign resources when CSV data changes
  useEffect(() => {
    if (csvData && csvData.length > 0) {
      assignResources();
    }
  }, [csvData, assignResources]);

  // Get filtered data
  const getFilteredData = useCallback(() => {
    if (!assignedData || assignedData.length === 0) return [];
    
    return assignedData.filter((item: Record<string, unknown>) => {
      if (filters.selected_proy !== 'Todos' && item.proyecto !== filters.selected_proy) return false;
      if (filters.selected_modulo !== 'Todos' && item.modulo !== filters.selected_modulo) return false;
      if (filters.selected_grupo !== 'Todos' && item.grupo_dev !== filters.selected_grupo) return false;
      if (filters.id_filter && !String(item.id).includes(filters.id_filter)) return false;
      if (filters.consultor_ntt !== 'Todos' && item.consultor_ntt !== filters.consultor_ntt) return false;
      return true;
    });
  }, [assignedData, filters]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <div className={`flex-1 transition-all duration-300 ${showSidebar ? 'ml-64' : 'ml-0'}`}>
          <div className="p-6">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                SAP Project Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Gestión y planificación de proyectos SAP
              </p>
            </div>

            {/* Navigation */}
            <div className="mb-6 flex space-x-4">
              <button
                onClick={() => setCurrentView('timeline')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentView === 'timeline'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Línea de Tiempo
              </button>
              <button
                onClick={() => setCurrentView('metrics')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentView === 'metrics'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Métricas
              </button>
              <button
                onClick={() => setCurrentView('upload')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentView === 'upload'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Subir CSV
              </button>
              <button
                onClick={() => setCurrentView('test')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentView === 'test'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Test
              </button>
            </div>

            {/* Content */}
            <div className="space-y-6">
              {/* Filters */}
              <Filters 
                data={getFilteredData()}
                onFilterChange={updateFilters}
              />

              {/* View Content */}
              {currentView === 'timeline' && (
                <Timeline 
                  data={getFilteredData()}
                  planConfig={{
                    start_date_col: 'fecha_inicio',
                    end_date_col: 'fecha_fin',
                    resource_col: 'responsable',
                    hours_col: 'duracion',
                    available_date_col: 'fecha_disponible',
                    plan_date_col: 'fecha_plan',
                    resource_title: 'ABAP',
                    resources_title: 'ABAPs',
                    assigned_title: 'Asignado',
                    use_group_based_assignment: false
                  }}
                />
              )}

              {currentView === 'metrics' && (
                <Metrics 
                  data={getFilteredData()}
                  planConfig={{
                    resource_col: 'responsable'
                  }}
                />
              )}

              {currentView === 'upload' && (
                <div className="space-y-6">
                  <SupabaseStatus />
                  <CSVUpload />
                </div>
              )}

              {currentView === 'test' && (
                <TestComponent />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 