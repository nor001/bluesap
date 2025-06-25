'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useAppStore } from '@/lib/store';
import { AppConfig } from '@/lib/config';
import { CSVUpload } from '@/components/CSVUpload';
import { Filters } from '@/components/Filters';
import { Metrics } from '@/components/Metrics';
import { ThemeToggle } from '@/components/ThemeToggle';
import { SupabaseStatus } from '@/components/SupabaseStatus';
import { Download, RefreshCw } from 'lucide-react';
import { SocialLogin } from './components/SocialLogin';
import { supabaseClient, isSupabaseAvailable } from './lib/supabase-client';
import { processSpecialCSV } from '@/lib/csv-processor';
import { logError } from '@/lib/error-handler';

// Importación dinámica del componente Timeline para evitar errores de SSR
const Timeline = dynamic(() => import('@/components/Timeline').then(mod => ({ default: mod.Timeline })), {
  ssr: false,
  loading: () => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Loading Timeline...</h3>
          <p className="text-gray-500 dark:text-gray-400">Preparing interactive chart</p>
        </div>
      </div>
    </div>
  ),
});

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const { 
    csvData, 
    assignedData, 
    filters, 
    loading, 
    planType, 
    metrics, 
    timelineData,
    assignResources, 
    updateFilters, 
    setPlanType, 
    setLoading, 
    setMetrics, 
    setTimelineData, 
    clearData, 
    syncToSupabase,
    loadFallbackData
  } = useAppStore();

  // Get plan configuration based on plan type
  const planConfig = AppConfig.getPlanConfig(planType);

  // Filter data based on current filters
  const filteredData = assignedData.filter(row => {
    const proyMatch = filters.selected_proy === "Todos" || row.PROY === filters.selected_proy;
    const moduloMatch = filters.selected_modulo === "Todos" || row.Módulo === filters.selected_modulo;
    const grupoMatch = filters.selected_grupo === "Todos" || row.grupo_dev === filters.selected_grupo;
    return proyMatch && moduloMatch && grupoMatch;
  });

  // Auto-assign resources when CSV data is loaded
  useEffect(() => {
    if (csvData.length > 0 && assignedData.length === 0) {
      assignResources();
    }
  }, [csvData.length, assignedData.length, assignResources]);

  // Load existing CSV data when user is authenticated
  useEffect(() => {
    if (user && csvData.length === 0) {
      const loadExistingData = async () => {
        try {
          // First try to load from fallback storage
          loadFallbackData();
          
          // If no fallback data, try to load from Supabase
          if (csvData.length === 0) {
            const response = await fetch('/api/download-csv');
            
            if (response.ok) {
              const csvText = await response.text();
              
              // Process CSV using centralized processor (preserving special format)
              const processedData = processSpecialCSV(csvText);
              
              if (processedData.rowCount > 0) {
                // Update store directly to avoid interfering with metadata
                const store = useAppStore.getState();
                store.csvData = processedData.data;
                
                // Force a re-render and trigger assignment
                setTimeout(() => {
                  assignResources();
                }, 100);
              }
            }
          }
        } catch (error) {
          // Log error but don't show to user - they can upload new CSV if needed
          logError({
            type: 'storage',
            message: 'Failed to load existing CSV data',
            details: error,
            timestamp: Date.now(),
            userFriendly: false
          }, 'HomePage');
        }
      };
      
      loadExistingData();
    }
  }, [user, csvData.length, assignResources, loadFallbackData]);

  useEffect(() => {
    async function checkUser() {
      if (!isSupabaseAvailable()) {
        setUser(null);
        setLoadingUser(false);
        return;
      }
      
      try {
        // Get current session first
        const { data: { session }, error: sessionError } = await supabaseClient!.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
          setLoadingUser(false);
          return;
        }
        
        // If no session, try to get user directly
        const { data: { user }, error: userError } = await supabaseClient!.auth.getUser();
        
        if (user) {
          setUser(user);
        } else {
          setUser(null);
        }
      } catch (error) {
        setUser(null);
        logError({
          type: 'auth',
          message: 'Failed to check user authentication',
          details: error,
          timestamp: Date.now(),
          userFriendly: false
        }, 'HomePage');
      } finally {
        setLoadingUser(false);
      }
    }
    
    checkUser();
    
    // Listen for auth changes
    const { data: { subscription } } = supabaseClient?.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          setUser(session.user);
        }
      }
    ) || { data: { subscription: null } };
    
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  if (loadingUser) {
    return <div className="w-full text-center mt-16">Cargando...</div>;
  }

  if (!user) {
    return <SocialLogin />;
  }

  const handleExport = (data: any[], filename: string) => {
    const csvContent = [
      // Headers
      Object.keys(data[0] || {}).join(','),
      // Data rows
      ...data.map(row => 
        Object.values(row).map(value => 
          typeof value === 'string' && value.includes(',') ? `"${value}"` : value
        ).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleLogout = async () => {
    if (isSupabaseAvailable()) {
      await supabaseClient!.auth.signOut();
    }
  };

  const handleSyncToSupabase = async () => {
    try {
      const success = await syncToSupabase();
      if (success) {
        // Show success message or update UI
      }
    } catch (error) {
      logError({
        type: 'network',
        message: 'Failed to sync to Supabase',
        details: error,
        timestamp: Date.now(),
        userFriendly: true
      }, 'HomePage');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                SAP Project Planning
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Supabase Connection Status */}
        <div className="mb-6">
          <SupabaseStatus />
        </div>

        {/* Upload Section */}
        <div className="mb-8">
          <CSVUpload />
        </div>

        {/* Data Display */}
        {csvData.length > 0 && (
          <>
            {/* Filters and Plan Type */}
            <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Filters 
                data={assignedData}
                onFilterChange={updateFilters} 
              />
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tipo de Plan:
                </label>
                <select
                  value={planType}
                  onChange={(e) => setPlanType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Plan de Desarrollo">Plan de Desarrollo</option>
                  <option value="Plan de Mantenimiento">Plan de Mantenimiento</option>
                  <option value="Plan de Soporte">Plan de Soporte</option>
                </select>
                <button
                  onClick={assignResources}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  <span>Asignar Recursos</span>
                </button>
              </div>
            </div>

            {/* Metrics */}
            <div className="mb-6">
              <Metrics 
                data={filteredData}
                planConfig={planConfig}
              />
            </div>

            {/* Timeline */}
            <div className="mb-8">
              <Timeline 
                data={filteredData}
                planConfig={planConfig}
              />
            </div>

            {/* Export and Sync Buttons */}
            <div className="flex space-x-4 mb-8">
              <button
                onClick={() => handleExport(csvData, 'sap-projects.csv')}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Exportar CSV Original</span>
              </button>
              {assignedData.length > 0 && (
                <button
                  onClick={() => handleExport(assignedData, 'sap-projects-assigned.csv')}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Exportar CSV Asignado</span>
                </button>
              )}
              <button
                onClick={handleSyncToSupabase}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
              >
                Sincronizar a Supabase
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
} 