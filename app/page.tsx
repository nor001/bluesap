'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { AppConfig } from '@/lib/config';
import { CSVUpload } from '@/components/CSVUpload';
import { Filters } from '@/components/Filters';
import { Metrics } from '@/components/Metrics';
import { Timeline } from '@/components/Timeline';
import { Download, RefreshCw } from 'lucide-react';

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">📅 SAP Project Planning</h1>
              <p className="text-gray-600">Resource allocation and timeline management</p>
            </div>
            
            {/* Plan Type Selector */}
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Planning Type:</label>
              <select
                value={planType}
                onChange={(e) => setPlanType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="Plan de Desarrollo">Plan de Desarrollo</option>
                <option value="Plan de Pruebas">Plan de Pruebas</option>
              </select>
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
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">⚙️ Configuration</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Planning Type
                    </label>
                    <select
                      value={planType}
                      onChange={(e) => setPlanType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
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
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">📤 Upload CSV Data</h2>
                <CSVUpload />
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-center">
                  <RefreshCw className="animate-spin h-8 w-8 text-primary-600 mr-3" />
                  <span className="text-lg text-gray-700">
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
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">📊 Timeline</h2>
                  <Timeline data={filteredData} planConfig={planConfig} />
                </div>

                {/* Data Table */}
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">📋 Detailed Assignment Table</h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            PROY
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Módulo
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Título
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {planConfig.resource_title}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Hours
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Plan Date
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredData.slice(0, 50).map((row, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {row.PROY || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {row.Módulo || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {row.Titulo || '-'}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                              !row[planConfig.resource_col] ? 'text-red-600 bg-red-50' : 'text-gray-900'
                            }`}>
                              {row[planConfig.resource_col] || 'Unassigned'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {row[planConfig.hours_col] || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {row[planConfig.plan_date_col] ? 
                                new Date(row[planConfig.plan_date_col]).toLocaleDateString() : 
                                '-'
                              }
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredData.length > 50 && (
                      <p className="text-sm text-gray-500 mt-2">
                        Showing first 50 rows of {filteredData.length} total rows
                      </p>
                    )}
                  </div>
                </div>

                {/* Export Section */}
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">📤 Export Data</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={() => handleExport(filteredData, 'filtered_data.csv')}
                      className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Filtered Data
                    </button>
                    <button
                      onClick={() => handleExport(assignedData, 'all_data.csv')}
                      className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
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