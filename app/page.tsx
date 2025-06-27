'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useAppStore } from '@/lib/store';
import { AppConfig } from '@/lib/config';
import { CSVUpload } from '@/components/CSVUpload';
import { ThemeToggle } from '@/components/ThemeToggle';
import { SupabaseStatus } from '@/components/SupabaseStatus';
import { Download, RefreshCw } from 'lucide-react';
import { SocialLogin } from './components/SocialLogin';
import { supabaseClient, isSupabaseAvailable } from './lib/supabase-client';
import { CSV_EXPORT_ORIGINAL, CSV_EXPORT_ASSIGNED } from '@/lib/supabase';
import { processSpecialCSV } from '@/lib/csv-processor';
import { logError } from '@/lib/error-handler';
import { auditedFetch } from '@/lib/auditedFetch';
import { getFallbackData } from '@/lib/fallback-storage';

// Importación dinámica del componente Timeline para evitar errores de SSR
const Timeline = dynamic(() => import('@/components/Timeline').then(mod => ({ default: mod.Timeline })), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="text-center">
        <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">📊</div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Loading Timeline...</h3>
        <p className="text-gray-500 dark:text-gray-400">Preparing interactive chart</p>
      </div>
    </div>
  ),
});

// Lazy load heavy components
const Metrics = dynamic(() => import('@/components/Metrics').then(mod => ({ default: mod.Metrics })), {
  ssr: false,
  loading: () => (
    <div className="animate-pulse">
      <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
    </div>
  ),
});

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [dataLoadAttempted, setDataLoadAttempted] = useState(false);
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
    loadFallbackData,
    setCSVData,
    loadCachedData,
    saveToCache,
  } = useAppStore();

  // Get plan configuration based on plan type
  const planConfig = AppConfig.getPlanConfig(planType);

  // Filter data based on current filters
  const filteredData = assignedData.filter((row: any) => {
    const proyMatch = filters.selected_proy === "Todos" || row.PROY === filters.selected_proy;
    const moduloMatch = filters.selected_modulo === "Todos" || row.Módulo === filters.selected_modulo;
    const grupoMatch = filters.selected_grupo === "Todos" || row.grupo_dev === filters.selected_grupo;
    const consultorMatch = filters.consultor_ntt === "Todos" || row['Consultor NTT'] === filters.consultor_ntt;
    const idMatch = !filters.id_filter || 
      (row.ID && row.ID.toString().toLowerCase().includes(filters.id_filter.toLowerCase()));
    
    return proyMatch && moduloMatch && grupoMatch && consultorMatch && idMatch;
  });

  // Auto-assign resources when CSV data is loaded (only for new uploads, not existing data)
  useEffect(() => {
    // Only auto-assign if this is a new upload (not existing data)
    // We'll let the user manually assign resources for existing data
    if (csvData.length > 0 && assignedData.length === 0 && !loading) {
      console.log('🔄 Auto-assigning resources...', { csvDataLength: csvData.length });
      // Don't auto-assign for existing data - let user do it manually
    }
  }, [csvData.length, assignedData.length, loading]);

  // Re-assign resources when plan type changes (only if already assigned)
  useEffect(() => {
    if (csvData.length > 0 && assignedData.length > 0 && !loading) {
      console.log('🔄 Re-assigning resources due to plan type change...', { planType });
      assignResources();
    }
  }, [planType, csvData.length, assignedData.length, loading]);

  // Show success message when resources are assigned
  useEffect(() => {
    if (assignedData.length > 0 && csvData.length > 0) {
      console.log('✅ Resources assigned successfully!', { 
        csvDataLength: csvData.length, 
        assignedDataLength: assignedData.length,
        sampleAssigned: assignedData[0]
      });
      // Resources assigned successfully
    }
  }, [assignedData.length, csvData.length]);

  // Load existing CSV data when user is authenticated
  useEffect(() => {
    if (user && csvData.length === 0 && !loadingData && !dataLoadAttempted) {
      setDataLoadAttempted(true);
      const loadExistingData = async () => {
        setLoadingData(true);
        const startTime = Date.now();
        
        try {
          // First try to load from cache (fastest)
          const cacheHit = loadCachedData();
          
          if (cacheHit) {
            setLoadingData(false);
            return; // assignResources will be called by the auto-assign useEffect
          } else {
            // Debug localStorage
            if (typeof window !== 'undefined') {
              const cached = localStorage.getItem('bluesap-csv-cache');
              if (cached) {
                const { timestamp } = JSON.parse(cached);
                const age = Date.now() - timestamp;
              } else {
              }
            }
          }

          // If no cache, try fallback storage
          const fallbackData = getFallbackData();
          
          if (fallbackData && fallbackData.csvData.length > 0) {
            loadFallbackData();
            setLoadingData(false);
            return;
          }
          
          // If no cache or fallback, try to download from Supabase
          try {
            const response = await fetch('/api/download-csv');
            
            if (response.ok) {
              const result = await response.json();
              
              if (result.success && result.csvContent) {
                const processedData = processSpecialCSV(result.csvContent);
                
                if (processedData.rowCount > 0) {
                  setCSVData(processedData.data);
                  saveToCache(processedData.data, result.metadata || {
                    row_count: processedData.rowCount,
                    file_size: result.csvContent.length,
                    uploaded_at: new Date().toISOString()
                  });
                  setLoadingData(false);
                  return;
                }
              }
            } else {
            }
          } catch (downloadError) {
          }
          
          // If all else fails, show message to user
          setLoadingData(false);
          
        } catch (error) {
          setLoadingData(false);
        } finally {
        }
      };

      loadExistingData();
    }
  }, [user, csvData.length, loadingData, dataLoadAttempted, loadCachedData, loadFallbackData, setCSVData, saveToCache]);

  useEffect(() => {
    async function checkUser() {
      if (!isSupabaseAvailable()) {
        setUser(null);
        setLoadingUser(false);
        return;
      }
      
      try {
        // Optimize: Get session with timeout to prevent hanging
        const sessionPromise = supabaseClient!.auth.getSession();
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Auth timeout')), 2000);
        });
        
        const { data: { session }, error: sessionError } = await Promise.race([
          sessionPromise, 
          timeoutPromise
        ]);
        
        if (session?.user) {
          setUser(session.user);
          setLoadingUser(false);
          return;
        }
        
        // Only try getUser if no session found (optimization)
        const { data: { user }, error: userError } = await supabaseClient!.auth.getUser();
        
        if (user) {
          setUser(user);
        } else {
          setUser(null);
        }
      } catch (error) {
        setUser(null);
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

  // Reset data load flag when user changes
  useEffect(() => {
    setDataLoadAttempted(false);
  }, [user]);

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando aplicación...</p>
        </div>
      </div>
    );
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
    } catch (error) {
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative z-0">
      {/* Main Content - Adjust margin when sidebar is present */}
      <main className={`mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-all duration-300 relative z-10 main-content ${
        csvData.length > 0 ? 'ml-64' : 'ml-0'
      }`}>
        {/* Supabase Connection Status */}
        <div className="mb-6">
          <SupabaseStatus />
        </div>

        {/* Data Display */}
        {csvData.length > 0 ? (
          <>
            {/* Show message if data is loaded but not assigned */}
            {assignedData.length === 0 && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="text-blue-400 dark:text-blue-300 mr-3">ℹ️</div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                      <p className="font-medium mb-1">Datos CSV cargados correctamente</p>
                      <p>Se encontraron {csvData.length} registros. Los recursos se asignarán automáticamente.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      console.log('🔄 Manual assignment triggered');
                      assignResources();
                    }}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {loading ? 'Asignando...' : 'Asignar Manualmente'}
                  </button>
                </div>
              </div>
            )}

            {/* Metrics - Only show if data is assigned */}
            {assignedData.length > 0 && (
              <div className="mb-6">
                <Metrics 
                  data={filteredData}
                  planConfig={planConfig}
                />
              </div>
            )}

            {/* Timeline - Only show if data is assigned */}
            {assignedData.length > 0 && (
              <div className="mb-8 relative z-5 timeline-container">
                <Timeline 
                  data={filteredData}
                  planConfig={planConfig}
                />
              </div>
            )}
          </>
        ) : (
          /* Show message if no data is loaded */
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="text-yellow-400 dark:text-yellow-300 mr-3">⚠️</div>
                <div className="text-sm text-yellow-700 dark:text-yellow-300">
                  <p className="font-medium mb-1">No hay datos cargados</p>
                  <p>Sube un archivo CSV o descarga los datos existentes para comenzar.</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    // Debug localStorage
                    if (typeof window !== 'undefined') {
                      const cached = localStorage.getItem('bluesap-csv-cache');
                    }
                  }}
                  className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-xs"
                >
                  Debug Cache
                </button>
                <button
                  onClick={async () => {
                    setLoadingData(true);
                    try {
                      const response = await fetch('/api/download-csv');
                      if (response.ok) {
                        const csvText = await response.text();
                        if (csvText) {
                          const processedData = processSpecialCSV(csvText);
                          if (processedData.rowCount > 0) {
                            setCSVData(processedData.data);
                            saveToCache(processedData.data, {
                              row_count: processedData.rowCount,
                              file_size: 0,
                              uploaded_at: new Date().toISOString()
                            });
                          }
                        }
                      }
                    } catch (error) {
                    } finally {
                      setLoadingData(false);
                    }
                  }}
                  disabled={loadingData}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {loadingData ? 'Descargando...' : 'Descargar Datos'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upload Section - Moved to bottom */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <CSVUpload />
          {loadingData && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  Cargando datos existentes...
                </span>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 