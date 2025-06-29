'use client';

import { PlanConfig } from '@/lib/types';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  TimeScale,
  Title,
  Tooltip,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { useEffect, useMemo, useState } from 'react';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

interface TimelineProps {
  data: Array<{
    ID?: string;
    grupo_dev?: string;
    [key: string]: unknown;
  }>;
  planConfig: PlanConfig;
}

/**
 * @ai-context Main component for SAP project timeline visualization
 * @ai-purpose Displays assigned tasks in Gantt format with intelligent pagination
 * @ai-data-expects Array of objects with start/end dates and assigned resources
 * @ai-performance-notes Handles large datasets with pagination and memoization
 * @ai-business-context ABAP resource planning visualization in SAP projects
 * @ai-special-cases Supports different date formats and module grouping
 * @ai-cognitive-load medium - Complex component with multiple states
 * @ai-focus-state clear - Well-defined pagination and filtering logic
 * @ai-session-type standard - Routine visualization operation
 */
export function Timeline({ data, planConfig }: TimelineProps) {
  const [isClient, setIsClient] = useState(false);
  const defaultViewMode = 'gantt';
  const [viewMode, setViewMode] = useState<'table' | 'chart' | 'gantt'>(
    defaultViewMode
  );
  const [currentPage, setCurrentPage] = useState(0);
  const [tasksPerPage, setTasksPerPage] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('timeline-tasks-per-page');
      return stored ? Number(stored) : 10;
    }
    return 10;
  });
  const [columnWidth] = useState(4);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Detect mobile screen size for responsive design
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Memoize timelineData to prevent unnecessary re-renders and improve performance
  const timelineData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data
      .filter((item: Record<string, unknown>) => {
        if (
          planConfig.resource_col &&
          item[planConfig.resource_col] !== planConfig.resource_col
        )
          return false;
        return true;
      })
      .map((item: Record<string, unknown>) => ({
        ...item,
        start: new Date(item[planConfig.start_date_col] as string),
        end: new Date(item[planConfig.end_date_col] as string),
        Task: item.ID || `Task_${data.indexOf(item)}`,
        Resource: item[planConfig.resource_col] as string,
        Hours: Number(item[planConfig.hours_col]) || 8.0,
        dev_group: String(item.grupo_dev || 'N/A'),
      }))
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [data, planConfig]);

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

  // Prepare Gantt data with pagination for better performance
  const sortedTimelineData = [...timelineData].sort((a, b) => {
    const startA = new Date(a.start);
    const startB = new Date(b.start);
    return startA.getTime() - startB.getTime();
  });

  // Paginate the data for better performance with large datasets
  const startIndex = currentPage * tasksPerPage;
  const endIndex = startIndex + tasksPerPage;
  const limitedTimelineData = sortedTimelineData.slice(startIndex, endIndex);

  // Loading state for client-side rendering
  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="text-center">
          <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">
            📊
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Loading Timeline...
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Preparing timeline view
          </p>
        </div>
      </div>
    );
  }

  // No data state with helpful information
  if (timelineData.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="text-center">
          <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">
            📊
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Timeline Data
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {data.length > 0
              ? `Data available but missing date columns. Found columns: ${Object.keys(data[0] || {}).join(', ')}`
              : 'Upload CSV data and assign resources to see the timeline'}
          </p>
          {data.length > 0 && (
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md text-left">
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-2">
                <strong>Expected columns:</strong>
              </p>
              <ul className="text-xs text-yellow-600 dark:text-yellow-400 space-y-1">
                <li>• Start Date: {planConfig.start_date_col}</li>
                <li>• End Date: {planConfig.end_date_col}</li>
                <li>• Resource: {planConfig.resource_col}</li>
                <li>• Hours: {planConfig.hours_col}</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }

  // View toggle component for different visualization modes
  const ViewToggle = () => (
    <div className="flex space-x-2 mb-4">
      <button
        onClick={() => setViewMode('gantt')}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          viewMode === 'gantt'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
        }`}
      >
        📅 Gantt View
      </button>
    </div>
  );

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
      const totalDays = Math.ceil(
        (latestDate.getTime() - earliestDate.getTime()) / (1000 * 60 * 60 * 24)
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Microsoft Project Style Gantt ({planConfig.resource_title})
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Tasks in rows, time in columns - Microsoft Project format
            </p>
            <div className="mt-2 text-xs text-gray-400 dark:text-gray-500">
              <p>
                Showing {visibleDateHeaders.length} days from{' '}
                {earliestDate.toLocaleDateString()} to{' '}
                {latestDate.toLocaleDateString()}
              </p>
              <p>
                Column width: {effectiveColumnWidth * 4}px (calculated:{' '}
                {effectiveColumnWidth}px base)
              </p>
              <p>Total timeline span: {totalDays} days</p>
              <p>
                Showing tasks {startIndex + 1}-
                {Math.min(endIndex, timelineData.length)} of{' '}
                {timelineData.length}
              </p>
              {isMobile && (
                <p className="text-blue-600 dark:text-blue-400 font-medium">
                  📱 Mobile view: Showing first 14 days for better readability
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 mb-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">
              Tasks per page:
            </label>
            <select
              value={tasksPerPage}
              onChange={e => {
                const value = Number(e.target.value);
                setTasksPerPage(value);
                setCurrentPage(0);
                if (typeof window !== 'undefined') {
                  localStorage.setItem(
                    'timeline-tasks-per-page',
                    String(value)
                  );
                }
              }}
              className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div className="overflow-x-auto w-full">
            <div className="w-full min-w-max">
              {/* Date Headers */}
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                <div
                  className="w-28 p-0 bg-gray-50 dark:bg-gray-700 border-r border-gray-200 dark:border-gray-600 font-medium text-xs text-gray-700 dark:text-gray-300 flex-shrink-0 flex items-center justify-start"
                  style={{ minWidth: '7rem', height: '24px' }}
                >
                  Task ID / ABAP
                </div>
                <div className="flex flex-1 min-w-0">
                  {visibleDateHeaders.map((date, index) => (
                    <div
                      key={index}
                      className={`h-6 border-r border-gray-200 dark:border-gray-600 relative flex-shrink-0 flex items-center justify-center ${
                        date.getDay() === 0 || date.getDay() === 6
                          ? 'bg-red-50 dark:bg-red-900/20'
                          : 'bg-gray-50 dark:bg-gray-700'
                      }`}
                      style={{
                        width: `${effectiveColumnWidth * 4}px`,
                        minWidth: `${effectiveColumnWidth * 4}px`,
                      }}
                    >
                      <span
                        style={{
                          fontSize: '10px',
                          lineHeight: '12px',
                          display: 'block',
                          margin: 0,
                          textAlign: 'center',
                        }}
                      >
                        {date.getDate()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Task Rows */}
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
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {startIndex + 1}-{Math.min(endIndex, timelineData.length)}{' '}
              of {timelineData.length} tasks
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {currentPage + 1} of{' '}
                {Math.ceil(timelineData.length / tasksPerPage)}
              </span>
              <button
                onClick={() =>
                  setCurrentPage(
                    Math.min(
                      Math.ceil(timelineData.length / tasksPerPage) - 1,
                      currentPage + 1
                    )
                  )
                }
                disabled={
                  currentPage >=
                  Math.ceil(timelineData.length / tasksPerPage) - 1
                }
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      );
    }
  };

  // View component
  const ViewComponent = GanttView;

  return (
    <div className="flex flex-col space-y-4">
      <ViewToggle />
      {ViewComponent()}
    </div>
  );
}

export default Timeline;
