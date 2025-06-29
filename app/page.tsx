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
import { calculateAssignments } from '@/lib/assignment-calculator';

export default function Home() {
  const {
    csvData,
    assignedData,
    filters,
    loading,
    planType,
    metrics,
    timelineData,
    csvMetadata,
    uploadCSV,
    assignResources,
    updateFilters,
    setPlanType,
    setLoading,
    setMetrics,
    setTimelineData,
    clearData,
    fetchCSVMetadata,
    setCSVMetadata,
    syncToSupabase,
    loadFallbackData,
    setCSVData,
    loadCachedData,
    saveToCache,
    clearCache
  } = useAppStore();

  // State for UI
  const [currentView, setCurrentView] = useState<'timeline' | 'metrics' | 'upload' | 'test'>('timeline');
  const [showSidebar, setShowSidebar] = useState(true);

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

  // Update metrics when assigned data changes
  useEffect(() => {
    if (assignedData && assignedData.length > 0) {
      const newMetrics = {
        total_projects: new Set(assignedData.map((item: Record<string, unknown>) => item.proyecto as string)).size,
        total_tasks: assignedData.length,
        assigned_tasks: assignedData.filter((item: Record<string, unknown>) => item.responsable).length,
        unassigned_tasks: assignedData.filter((item: Record<string, unknown>) => !item.responsable).length
      };
      setMetrics(newMetrics);
    }
  }, [assignedData, setMetrics]);

  // Handle file upload
  const handleFileUpload = useCallback(async (file: File) => {
    try {
      await uploadCSV(file);
    } catch (err) {
      console.error('Upload failed:', err);
    }
  }, [uploadCSV]);

  // Handle export
  const handleExport = useCallback(async (type: string) => {
    try {
      const response = await fetch('/api/download-csv');
      const result = await response.json();
      
      if (result.success && result.csvContent) {
        const blob = new Blob([result.csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sap-data-${type}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Export failed:', err);
    }
  }, []);

  // Handle logout
  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/auth-validate', { method: 'POST' });
    } catch (err) {
      console.error('Logout failed:', err);
    }
  }, []);

  // Handle sync to Supabase
  const handleSyncToSupabase = useCallback(async () => {
    try {
      const success = await syncToSupabase();
      if (success) {
        console.log('Data synced to Supabase successfully');
      }
    } catch (err) {
      console.error('Sync failed:', err);
    }
  }, [syncToSupabase]);

  // Handle cache operations
  const handleCacheOperation = useCallback(async (operation: string) => {
    try {
      const response = await fetch('/api/clear-cache', { method: 'POST' });
      const result = await response.json();
      
      if (result.success) {
        console.log('Cache operation completed');
      }
    } catch (err) {
      console.error('Cache operation failed:', err);
    }
  }, []);

  // Calculate business days between dates
  const calculateBusinessDays = useCallback((startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    let businessDays = 0;
    const current = new Date(start);
    
    while (current <= end) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        businessDays++;
      }
      current.setDate(current.getDate() + 1);
    }
    
    return businessDays;
  }, []);

  // Process timeline data
  const processTimelineData = useCallback(() => {
    if (!assignedData || assignedData.length === 0) return [];
    
    return assignedData.map((item: Record<string, unknown>) => {
      const startDate = item.fecha_inicio as string;
      const endDate = item.fecha_fin as string;
      const businessDays = calculateBusinessDays(startDate, endDate);
      
      return {
        ...item,
        businessDays,
        start: new Date(startDate),
        end: new Date(endDate)
      };
    }).sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [assignedData, calculateBusinessDays]);

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