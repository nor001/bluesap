'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useAppStore } from '@/lib/store';
import { AppConfig } from '@/lib/config';
import { CSVUpload } from '@/components/CSVUpload';
import { Filters } from '@/components/Filters';
import { Metrics } from '@/components/Metrics';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Download, RefreshCw } from 'lucide-react';
import { SocialLogin } from './components/SocialLogin';
import { supabase } from './lib/supabase';

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
  const { 
    csvData, 
    assignedData, 
    filters, 
    loading, 
    planType, 
    uploadCSV, 
    assignResources, 
    updateFilters, 
    setPlanType 
  } = useAppStore();

  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [planConfig, setPlanConfig] = useState(AppConfig.getPlanConfig(planType));
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Update plan config when plan type changes
  useEffect(() => {
    setPlanConfig(AppConfig.getPlanConfig(planType));
  }, [planType]);

  // Apply filters to data
  useEffect(() => {
    if (assignedData.length === 0) {
      setFilteredData([]);
      return;
    }

    let filtered = [...assignedData];

    // Apply project filter
    if (filters.selected_proy && filters.selected_proy !== "Todos") {
      filtered = filtered.filter(row => row.PROY === filters.selected_proy);
    }

    // Apply module filter
    if (filters.selected_modulo && filters.selected_modulo !== "Todos") {
      filtered = filtered.filter(row => row.Módulo === filters.selected_modulo);
    }

    // Apply group filter
    if (filters.selected_grupo && filters.selected_grupo !== "Todos") {
      filtered = filtered.filter(row => row.grupo_dev === filters.selected_grupo);
    }

    setFilteredData(filtered);
  }, [assignedData, filters]);

  // Auto-assign resources when CSV data is loaded
  useEffect(() => {
    if (csvData.length > 0 && assignedData.length === 0) {
      assignResources();
    }
  }, [csvData, assignedData.length, assignResources]);

  useEffect(() => {
    async function checkUser() {
      if (!supabase) {
        setUser(null);
        setLoadingUser(false);
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoadingUser(false);
    }
    checkUser();
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

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">📅 SAP Project Planning</h1>
              <p className="text-gray-600 dark:text-gray-300">Resource allocation and timeline management</p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Plan Type Selector */}
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Planning Type:</label>
                <select
                  value={planType}
                  onChange={(e) => setPlanType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="Plan de Desarrollo">Plan de Desarrollo</option>
                  <option value="Plan de Pruebas">Plan de Pruebas</option>
                </select>
              </div>

              {/* Theme Toggle */}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Configuration */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">⚙️ Configuration</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Planning Type
                    </label>
                    <select
                      value={planType}
                      onChange={(e) => setPlanType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="Plan de Desarrollo">Plan de Desarrollo</option>
                      <option value="Plan de Pruebas">Plan de Pruebas</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Filters */}
              {assignedData.length > 0 && (
                <Filters 
                  data={assignedData} 
                  onFilterChange={(newFilters) => updateFilters(newFilters)} 
                />
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Upload Section */}
            {csvData.length === 0 && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">📤 Upload CSV Data</h2>
                <CSVUpload />
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-center">
                  <RefreshCw className="animate-spin h-8 w-8 text-primary-600 dark:text-primary-400 mr-3" />
                  <span className="text-lg text-gray-700 dark:text-gray-300">
                    {csvData.length > 0 ? 'Assigning resources...' : 'Processing data...'}
                  </span>
                </div>
              </div>
            )}

            {/* Data Display */}
            {assignedData.length > 0 && !loading && (
              <>
                {/* Metrics */}
                <Metrics data={filteredData} planConfig={planConfig} />

                {/* Timeline */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">📊 Timeline</h2>
                  <Timeline data={filteredData} planConfig={planConfig} />
                </div>

                {/* Data Table */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">📋 Detailed Assignment Table</h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            PROY
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Módulo
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Título
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Grupo Dev
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            {planConfig.resource_title}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            {planConfig.start_date_col}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            {planConfig.end_date_col}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            {planConfig.hours_col}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredData.map((row, index) => (
                          <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              {row.PROY}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {row.Módulo}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {row.Título}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {row.grupo_dev}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {row[planConfig.resource_col]}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {row[planConfig.start_date_col]}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {row[planConfig.end_date_col]}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {row[planConfig.hours_col]}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Export Buttons */}
                  <div className="mt-6 flex space-x-4">
                    <button
                      onClick={() => handleExport(filteredData, `${planType}_filtered_data.csv`)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-800"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Filtered Data
                    </button>
                    <button
                      onClick={() => handleExport(assignedData, `${planType}_all_data.csv`)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-800"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export All Data
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 