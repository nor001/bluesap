'use client';

import { PlanConfig } from '@/lib/types';
import { useEffect, useMemo, useState } from 'react';

interface TimelineProps {
  data: Array<Record<string, unknown>>;
  planConfig: PlanConfig;
}

interface TimelineItem {
  Task: string;
  Resource: string;
  start: string;
  end: string;
  hours: number;
}

/**
 * Main component for SAP project timeline visualization
 * Displays assigned tasks in Gantt format with intelligent pagination
 * Special cases: Supports different date formats and module grouping
 */
export function Timeline({ data, planConfig }: TimelineProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [tasksPerPage, setTasksPerPage] = useState(20);
  const [viewMode, setViewMode] = useState<'list' | 'gantt'>('gantt');
  const [columnWidth, setColumnWidth] = useState(4);
  const [isClient, setIsClient] = useState(false);

  // Client-side rendering check
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Convert data to timeline format
  const timelineData: TimelineItem[] = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];

    return data
      .filter((item) => {
        const startDate = item[planConfig.start_date_col];
        const endDate = item[planConfig.end_date_col];
        const resource = item[planConfig.resource_col];
        const hours = item[planConfig.hours_col];

        return (
          startDate &&
          endDate &&
          resource &&
          resource !== '' &&
          resource !== 'None' &&
          resource !== 'nan' &&
          hours &&
          Number(hours) > 0
        );
      })
      .map((item) => ({
        Task: String(item.id || item.proyecto || 'Unknown Task'),
        Resource: String(item[planConfig.resource_col]),
        start: new Date(item[planConfig.start_date_col] as string).toISOString(),
        end: new Date(item[planConfig.end_date_col] as string).toISOString(),
        hours: Number(item[planConfig.hours_col]) || 0,
      }))
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  }, [data, planConfig]);

  // Pagination
  const totalPages = Math.ceil(timelineData.length / tasksPerPage);
  const startIndex = currentPage * tasksPerPage;
  const endIndex = startIndex + tasksPerPage;
  const limitedTimelineData = timelineData.slice(startIndex, endIndex);

  // Mobile detection
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Debug logging for development environment with systematic isolation
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Step 1: Data validation check
      const _dataValidation = {
        hasData: !!data,
        dataLength: data?.length || 0,
        hasPlanConfig: !!planConfig,
        requiredColumns: planConfig ? [
          planConfig.start_date_col,
          planConfig.end_date_col,
          planConfig.resource_col,
          planConfig.hours_col
        ] : []
      };
      
      // Step 2: State consistency check
      const _stateValidation = {
        viewMode,
        currentPage,
        tasksPerPage,
        columnWidth,
        isClient
      };
      
      // Step 3: Performance metrics
      const _performanceMetrics = {
        timelineDataLength: timelineData?.length || 0,
        paginationInfo: {
          startIndex: currentPage * tasksPerPage,
          endIndex: (currentPage * tasksPerPage) + tasksPerPage,
          totalPages: Math.ceil((timelineData?.length || 0) / tasksPerPage)
        }
      };
      
      // Debug information removed for production
    }
  }, [data, planConfig, viewMode, currentPage, tasksPerPage, columnWidth, timelineData, isClient]);

  // Paleta de 24 colores bien diferenciados para recursos ABAP
  const COLOR_PALETTE = [
    '#e6194b',
    '#3cb44b',
    '#ffe119',
    '#4363d8',
    '#f58231',
    '#911eb4',
    '#46f0f0',
    '#f032e6',
    '#bcf60c',
    '#fabebe',
    '#008080',
    '#e6beff',
    '#9a6324',
    '#fffac8',
    '#800000',
    '#aaffc3',
    '#808000',
    '#ffd8b1',
    '#000075',
    '#808080',
    '#ffffff',
    '#000000',
    '#a9a9a9',
    '#b8860b',
  ];

  // Get unique ABAP resources and assign colors
  const uniqueAbaps = Array.from(
    new Set(timelineData.map(t => t.Resource))
  ).sort();
  const getABAPColor = (abapName: string) => {
    const idx = uniqueAbaps.indexOf(abapName);
    return COLOR_PALETTE[idx % COLOR_PALETTE.length];
  };

  if (!isClient) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-medium mb-2">No hay datos para mostrar</h3>
          <p>Sube un archivo CSV con datos de proyectos para ver la línea de tiempo</p>
        </div>
      </div>
    );
  }

  // Gantt view component
  const GanttView = () => {
    if (limitedTimelineData.length > 0) {
      // Full timeline Gantt - Microsoft Project style
      const earliestDate = new Date(
        Math.min(
          ...limitedTimelineData.map(item => new Date(item.start).getTime())
        )
      );
      const latestDate = new Date(
        Math.max(
          ...limitedTimelineData.map(item => new Date(item.end).getTime())
        )
      );

      // Generar todos los días (incluyendo fines de semana) para el encabezado
      const dateHeaders: Date[] = [];
      const currentDate = new Date(earliestDate);
      while (currentDate <= latestDate) {
        dateHeaders.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Calculate optimal column width based on available space and screen size
      const calculateOptimalColumnWidth = () => {
        if (isMobile) {
          // Mobile: use wider columns but show fewer days
          return 8; // 32px per column on mobile
        }

        // Desktop: more conservative calculation
        const availableWidth = 1600 - 192; // 192px = 48 * 4 (task info width)
        const optimalWidth = Math.max(
          3,
          Math.min(6, Math.floor(availableWidth / dateHeaders.length))
        );
        return optimalWidth;
      };

      // Use calculated width if columnWidth is 4 (default), otherwise use user selection
      const effectiveColumnWidth =
        columnWidth === 4 ? calculateOptimalColumnWidth() : columnWidth;

      // Always show all date headers (days) in the global range
      const visibleDateHeaders = dateHeaders;

      return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header Controls */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Línea de Tiempo Gantt
                </h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {limitedTimelineData.length} tareas mostradas
                </span>
              </div>

              <div className="flex items-center space-x-4">
                {/* Column Width Control */}
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-600 dark:text-gray-400">
                    Ancho:
                  </label>
                  <select
                    value={columnWidth}
                    onChange={(e) => setColumnWidth(Number(e.target.value))}
                    className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value={3}>Narrow</option>
                    <option value={4}>Normal</option>
                    <option value={6}>Wide</option>
                    <option value={8}>Extra Wide</option>
                  </select>
                </div>

                {/* Tasks Per Page Control */}
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-600 dark:text-gray-400">
                    Por página:
                  </label>
                  <select
                    value={tasksPerPage}
                    onChange={(e) => {
                      setTasksPerPage(Number(e.target.value));
                      setCurrentPage(0);
                    }}
                    className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Header */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <div className="w-28 p-2 border-r border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 flex-shrink-0">
              <div className="text-xs font-medium text-gray-900 dark:text-white">
                Tarea
              </div>
            </div>
            <div className="flex flex-1 min-w-0 overflow-x-auto">
              {visibleDateHeaders.map((date, index) => (
                <div
                  key={index}
                  className={`p-2 border-r border-gray-200 dark:border-gray-600 flex-shrink-0 text-center ${
                    date.getDay() === 0 || date.getDay() === 6
                      ? 'bg-red-50 dark:bg-red-900/20'
                      : 'bg-gray-50 dark:bg-gray-700'
                  }`}
                  style={{
                    width: `${effectiveColumnWidth * 4}px`,
                    minWidth: `${effectiveColumnWidth * 4}px`,
                  }}
                >
                  <div className="text-xs font-medium text-gray-900 dark:text-white">
                    {date.getDate()}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {date.toLocaleDateString('es-ES', { month: 'short' })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline Content */}
          <div className="overflow-y-auto max-h-96">
            <div className="min-w-full">

              {limitedTimelineData.map((item, index) => {
                const taskStart = new Date(item.start);
                const taskEnd = new Date(item.end);
                // Calcular días hábiles entre start y end
                const businessDays: number[] = [];
                for (let i = 0; i < dateHeaders.length; i++) {
                  const d = dateHeaders[i];
                  if (
                    d >= taskStart &&
                    d <= taskEnd &&
                    d.getDay() !== 0 &&
                    d.getDay() !== 6
                  ) {
                    businessDays.push(i);
                  }
                }

                return (
                  <div
                    key={index}
                    className="flex border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 h-6"
                  >
                    {/* Task Info */}
                    <div className="w-28 p-0 border-r border-gray-200 dark:border-gray-600 flex-shrink-0 flex items-center">
                      <div
                        className="font-medium text-gray-900 dark:text-white leading-[1] m-0 p-0"
                        style={{ fontSize: '9px' }}
                      >
                        {String(item.Task)}
                      </div>
                    </div>

                    {/* Timeline Cells */}
                    <div className="flex flex-1 min-w-0">
                      {visibleDateHeaders.map((date, dateIndex) => {
                        // Solo pintar barra en días hábiles de la tarea
                        const isTaskDay = businessDays.includes(dateIndex);
                        const isWeekend =
                          date.getDay() === 0 || date.getDay() === 6;

                        return (
                          <div
                            key={dateIndex}
                            className={`h-6 border-r border-gray-200 dark:border-gray-600 relative flex-shrink-0 ${
                              isWeekend
                                ? 'bg-red-50 dark:bg-red-900/20'
                                : 'bg-white dark:bg-gray-800'
                            }`}
                            style={{
                              width: `${effectiveColumnWidth * 4}px`,
                              minWidth: `${effectiveColumnWidth * 4}px`,
                            }}
                          >
                            {isTaskDay && (
                              <div
                                className="absolute inset-0 rounded-sm opacity-80"
                                style={{
                                  backgroundColor: getABAPColor(item.Resource),
                                }}
                                title={`${item.Task} - ${item.Resource} (${businessDays.length} days)`}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Mostrando {startIndex + 1} a {Math.min(endIndex, timelineData.length)} de{' '}
                  {timelineData.length} tareas
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                    className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Página {currentPage + 1} de {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                    disabled={currentPage === totalPages - 1}
                    className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-medium mb-2">No hay tareas asignadas</h3>
          <p>Asigna recursos a las tareas para ver la línea de tiempo</p>
        </div>
      </div>
    );
  };

  // List view component
  const ListView = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Lista de Tareas
        </h3>
      </div>
      <div className="overflow-y-auto max-h-96">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Tarea
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Recurso
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Inicio
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Fin
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Horas
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {limitedTimelineData.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {item.Task}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: getABAPColor(item.Resource) }}
                    ></div>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {item.Resource}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {new Date(item.start).toLocaleDateString('es-ES')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {new Date(item.end).toLocaleDateString('es-ES')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {item.hours}h
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setViewMode('gantt')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'gantt'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            Vista Gantt
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            Vista Lista
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Recursos:
          </div>
          <div className="flex items-center space-x-2">
            {uniqueAbaps.slice(0, 5).map((abap) => (
              <div key={abap} className="flex items-center">
                <div
                  className="w-3 h-3 rounded-full mr-1"
                  style={{ backgroundColor: getABAPColor(abap) }}
                ></div>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {abap}
                </span>
              </div>
            ))}
            {uniqueAbaps.length > 5 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                +{uniqueAbaps.length - 5} más
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'gantt' ? <GanttView /> : <ListView />}
    </div>
  );
}
