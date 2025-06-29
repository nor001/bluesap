'use client';

import { logError } from '@/lib/error-handler';
import { useAppStore } from '@/lib/store';
import { isSupabaseAvailable, supabaseClient } from '@/lib/supabase-client';
import { FilterState } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Clock, Download, FileText, Filter, Upload } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo, useState } from 'react';
import { ThemeToggle } from './ThemeToggle';

const tabs = [
  { href: '/', label: 'Inicio', icon: '🏠' },
  { href: '/validaciones/esfu', label: 'Validar ESFU', icon: '🧮' },
  { href: '/validaciones/dt', label: 'Validar DT', icon: '📄' },
  { href: '/documentacion', label: 'Documentación', icon: '📚' },
  { href: '/configuracion', label: 'Configuración', icon: '⚙️' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [dragActive, setDragActive] = useState(false);
  const {
    filters,
    updateFilters,
    assignedData,
    csvData,
    csvMetadata,
    uploadCSV,
    planType,
    setPlanType,
  } = useAppStore();

  const filterOptions = useMemo(() => {
    // Use assignedData if available, otherwise use csvData
    const dataToUse = assignedData.length > 0 ? assignedData : csvData;

    if (!dataToUse || dataToUse.length === 0) {
      return {
        proyOptions: ['Todos'],
        moduloOptions: ['Todos'],
        grupoOptions: ['Todos'],
        consultorOptions: ['Todos'],
      };
    }

    const proyOptions = [
      'Todos',
      ...Array.from(
        new Set(dataToUse.map(row => row.PROY).filter(Boolean))
      ).sort(),
    ];
    const moduloOptions = [
      'Todos',
      ...Array.from(
        new Set(dataToUse.map(row => row.Módulo).filter(Boolean))
      ).sort(),
    ];

    const grupoOptions = dataToUse.some(row => row.grupo_dev)
      ? [
          'Todos',
          ...Array.from(
            new Set(dataToUse.map(row => row.grupo_dev).filter(Boolean))
          ).sort(),
        ]
      : ['Todos'];

    const consultorOptions = dataToUse.some(row => row['Consultor NTT'])
      ? [
          'Todos',
          ...Array.from(
            new Set(dataToUse.map(row => row['Consultor NTT']).filter(Boolean))
          ).sort(),
        ]
      : ['Todos'];

    return { proyOptions, moduloOptions, grupoOptions, consultorOptions };
  }, [assignedData, csvData]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    updateFilters(newFilters);
  };

  const handleLogout = async () => {
    if (isSupabaseAvailable()) {
      try {
        await supabaseClient!.auth.signOut();
      } catch (error) {
        logError(
          {
            type: 'auth',
            message: 'Failed to sign out from Supabase',
            details: error,
            timestamp: Date.now(),
            userFriendly: true,
          },
          'sidebar'
        );
      }
    }
  };

  // Show filters if we have any data (CSV or assigned)
  const hasData = csvData.length > 0 || assignedData.length > 0;

  // Helper to format date/time
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "dd 'de' MMMM 'de' yyyy", { locale: es });
    } catch {
      return dateString;
    }
  };
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'HH:mm:ss');
    } catch {
      return '';
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    try {
      // Validate file type
      if (!file.name.toLowerCase().endsWith('.csv')) {
        return;
      }

      // Validate file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        return;
      }

      await uploadCSV(file);
    } catch (error) {
      logError(
        {
          type: 'processing',
          message: 'Failed to upload CSV file',
          details: error,
          timestamp: Date.now(),
          userFriendly: true,
        },
        'sidebar'
      );
    }
  };

  return (
    <>
      {/* Top Header with Tabs */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 z-40">
        {/* Logo and Tabs */}
        <div className="flex items-center space-x-8">
          {/* Logo */}
          <div className="flex items-center font-bold text-lg">
            <span className="mr-2">📊</span> SAP Project
          </div>

          {/* Tabs */}
          <nav className="flex space-x-1">
            {tabs.map(tab => (
              <Link key={tab.href} href={tab.href} legacyBehavior>
                <a
                  className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors border-b-2 ${
                    pathname === tab.href
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-200 border-blue-500'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border-transparent hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2 text-base">{tab.icon}</span>
                  {tab.label}
                </a>
              </Link>
            ))}
          </nav>
        </div>

        {/* Right side controls */}
        <div className="flex items-center space-x-4">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Left Sidebar with Filters - Only show on main page when there's data */}
      {pathname === '/' && hasData && (
        <div className="fixed left-0 top-16 w-64 h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-30 overflow-y-auto sidebar-filters">
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filtros
            </h3>
            <div className="space-y-4">
              {/* Plan Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo de Plan:
                </label>
                <select
                  value={planType}
                  onChange={e => setPlanType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Plan de Desarrollo">Plan de Desarrollo</option>
                  <option value="Plan de Mantenimiento">
                    Plan de Mantenimiento
                  </option>
                  <option value="Plan de Soporte">Plan de Soporte</option>
                </select>
              </div>

              {/* Project Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Proyecto:
                </label>
                <select
                  value={filters.selected_proy}
                  onChange={e =>
                    handleFilterChange('selected_proy', e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {filterOptions.proyOptions.map(option => (
                    <option key={String(option)} value={String(option)}>
                      {String(option)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Module Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Módulo:
                </label>
                <select
                  value={filters.selected_modulo}
                  onChange={e =>
                    handleFilterChange('selected_modulo', e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {filterOptions.moduloOptions.map(option => (
                    <option key={String(option)} value={String(option)}>
                      {String(option)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Group Filter */}
              {filterOptions.grupoOptions.length > 1 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Grupo:
                  </label>
                  <select
                    value={filters.selected_grupo}
                    onChange={e =>
                      handleFilterChange('selected_grupo', e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {filterOptions.grupoOptions.map(option => (
                      <option key={String(option)} value={String(option)}>
                        {String(option)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Consultor NTT Filter */}
              {filterOptions.consultorOptions.length > 1 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Consultor NTT:
                  </label>
                  <select
                    value={filters.consultor_ntt}
                    onChange={e =>
                      handleFilterChange('consultor_ntt', e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {filterOptions.consultorOptions.map(option => (
                      <option key={String(option)} value={String(option)}>
                        {String(option)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* ID Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ID:
                </label>
                <input
                  type="text"
                  value={filters.id_filter}
                  onChange={e =>
                    handleFilterChange('id_filter', e.target.value)
                  }
                  placeholder="Buscar por ID (coincidencia parcial)..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Filter Status Indicator */}
              {(filters.selected_proy !== 'Todos' ||
                filters.selected_modulo !== 'Todos' ||
                filters.selected_grupo !== 'Todos' ||
                filters.consultor_ntt !== 'Todos' ||
                filters.id_filter) && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="text-blue-400 dark:text-blue-300 mr-2">
                          🔍
                        </div>
                        <span className="text-xs text-blue-700 dark:text-blue-300">
                          Filtros activos
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          updateFilters({
                            selected_proy: 'Todos',
                            selected_modulo: 'Todos',
                            selected_grupo: 'Todos',
                            consultor_ntt: 'Todos',
                            id_filter: '',
                          });
                        }}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 underline"
                      >
                        Limpiar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* CSV Metadata Info - debajo de los filtros */}
            {csvMetadata && (
              <div className="mt-6 mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md flex flex-col gap-1">
                <div className="flex items-center mb-1">
                  <Clock className="h-4 w-4 text-green-400 dark:text-green-300 mr-2" />
                  <span className="text-xs text-green-700 dark:text-green-300 font-medium">
                    📅 Última Actualización del CSV
                  </span>
                </div>
                <div className="text-xs text-green-700 dark:text-green-300">
                  <span>
                    {formatDate(csvMetadata.uploaded_at)}{' '}
                    {formatTime(csvMetadata.uploaded_at)}
                  </span>
                  <span className="mx-1">•</span>
                  <span>
                    Filas: {csvMetadata.row_count} | Tamaño:{' '}
                    {(csvMetadata.file_size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              </div>
            )}
          </div>
          {/* CSV Upload Area - al final del sidebar */}
          <div className="p-4 pt-0">
            <div
              className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                dragActive
                  ? 'border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center">
                <Upload
                  className={`h-6 w-6 mb-2 ${
                    dragActive
                      ? 'text-blue-400 dark:text-blue-300'
                      : 'text-gray-400 dark:text-gray-500'
                  }`}
                />
                <p
                  className={`text-xs ${
                    dragActive
                      ? 'text-blue-600 dark:text-blue-300'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {dragActive
                    ? 'Suelta el archivo CSV aquí'
                    : 'Sube tu archivo CSV • Arrastra y suelta aquí, o'}{' '}
                  {!dragActive && (
                    <span
                      className="text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 font-medium cursor-pointer"
                      onClick={() =>
                        document.getElementById('sidebar-csv-upload')?.click()
                      }
                    >
                      busca archivos
                    </span>
                  )}
                </p>
                <input
                  id="sidebar-csv-upload"
                  type="file"
                  accept=".csv"
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      handleFile(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
                <div className="flex items-center justify-center text-xs text-gray-400 dark:text-gray-500 mt-1">
                  <FileText className="h-3 w-3 mr-1" />
                  Solo archivos CSV, máximo 50MB
                </div>
              </div>
            </div>
          </div>

          {/* Download Assigned Data Button */}
          {assignedData.length > 0 && (
            <div className="p-4 pt-2">
              <button
                onClick={() => {
                  const handleExport = (
                    data: Array<Record<string, unknown>>,
                    filename: string
                  ) => {
                    const csvContent = [
                      // Headers
                      Object.keys(data[0] || {}).join(','),
                      // Data rows
                      ...data.map(row =>
                        Object.values(row)
                          .map(value =>
                            typeof value === 'string' && value.includes(',')
                              ? `"${value}"`
                              : value
                          )
                          .join(',')
                      ),
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

                  handleExport(assignedData, 'datos-asignados.csv');
                }}
                className="w-full px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 font-medium"
              >
                <Download className="h-4 w-4" />
                <span>Descargar CSV Asignado</span>
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                Incluye ABAPs asignados y fechas calculadas
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
