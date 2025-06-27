'use client';

import React from "react";
import { useState, useEffect } from 'react';
import { TimelineData, PlanConfig } from '@/lib/types';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { AppConfig } from '@/lib/config';

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
  data: any[];
  planConfig: PlanConfig;
  extraHoverCols?: string[];
  preciseHours?: boolean;
}

// Paleta de 24 colores bien diferenciados
const COLOR_PALETTE = [
  '#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#911eb4', '#46f0f0', '#f032e6',
  '#bcf60c', '#fabebe', '#008080', '#e6beff', '#9a6324', '#fffac8', '#800000', '#aaffc3',
  '#808000', '#ffd8b1', '#000075', '#808080', '#ffffff', '#000000', '#a9a9a9', '#b8860b'
];

// Utilidad para generar color pastel único por nombre
function stringToPastelColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 60%, 80%)`;
}

// Utilidad para sumar días hábiles a una fecha
function addBusinessDays(startDate: Date, businessDays: number): Date {
  let current = new Date(startDate);
  let added = 0;
  while (added < businessDays) {
    current.setDate(current.getDate() + 1);
    const day = current.getDay();
    if (day !== 0 && day !== 6) { // 0 = domingo, 6 = sábado
      added++;
    }
  }
  return current;
}

// Utilidad para contar días hábiles entre dos fechas (inclusive start, exclusive end)
function countBusinessDays(start: Date, end: Date): number {
  let count = 0;
  let current = new Date(start);
  while (current < end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

export function Timeline({ data, planConfig, extraHoverCols = [], preciseHours = false }: TimelineProps) {
  const [isClient, setIsClient] = useState(false);
  const defaultViewMode = 'gantt';
  const [viewMode, setViewMode] = useState<'table' | 'chart' | 'gantt'>(defaultViewMode);
  const [currentPage, setCurrentPage] = useState(0);
  const [tasksPerPage, setTasksPerPage] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('timeline-tasks-per-page');
      return stored ? Number(stored) : 10;
    }
    return 10;
  });
  const [columnWidth, setColumnWidth] = useState(4);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Debug logging
  useEffect(() => {
    console.log('🔍 Timeline Debug:', {
      dataLength: data?.length || 0,
      planConfig,
      sampleData: data?.[0],
      viewMode,
      currentPage,
      tasksPerPage,
      columnWidth
    });
  }, [data, planConfig, viewMode, currentPage, tasksPerPage, columnWidth]);

  // Simple data processing without useMemo
  const timelineData: TimelineData[] = [];
  
  if (data && data.length > 0) {
    for (const row of data) {
      const startDate = row[planConfig.start_date_col];
      const endDate = row[planConfig.end_date_col];
      const resource = row[planConfig.resource_col];
      
      if (startDate && endDate && resource) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        timelineData.push({
          Task: row.ID || `Task_${timelineData.length}`,
          Start: start.toISOString(),
          Finish: end.toISOString(),
          Resource: resource,
          Hours: Number(row[planConfig.hours_col]) || 8.0,
          dev_group: String(row.grupo_dev || 'N/A'),
        });
      }
    }
  }

  // Debug timeline data
  useEffect(() => {
    console.log('🔍 Timeline Data Processed:', {
      timelineDataLength: timelineData.length,
      sampleTimeline: timelineData[0],
      planConfigCols: {
        start_date_col: planConfig.start_date_col,
        end_date_col: planConfig.end_date_col,
        resource_col: planConfig.resource_col,
        hours_col: planConfig.hours_col
      }
    });
  }, [timelineData, planConfig]);

  // Justo antes de chartData:
  const uniqueAbaps = Array.from(new Set(timelineData.map(t => t.Resource))).sort();
  const getABAPColor = (abapName: string) => {
    const idx = uniqueAbaps.indexOf(abapName);
    return COLOR_PALETTE[idx % COLOR_PALETTE.length];
  };

  // Prepare chart data for bar chart
  const chartData = {
    labels: timelineData.map(item => item.Task),
    datasets: [
      {
        label: 'Hours',
        data: timelineData.map(item => Number(item.Hours) || 0),
        backgroundColor: timelineData.map(item => getABAPColor(item.Resource)),
        borderColor: timelineData.map(item => getABAPColor(item.Resource)),
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `${planConfig.resource_title} Timeline`,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Hours',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Tasks',
        },
      },
    },
  };

  // Prepare Gantt data - Fixed format with limited tasks for better readability
  const maxTasksToShow = tasksPerPage; // Use pagination instead of fixed limit
  
  // Sort timeline data by start date for chronological order
  const sortedTimelineData = [...timelineData].sort((a, b) => {
    const startA = new Date(a.Start);
    const startB = new Date(b.Start);
    return startA.getTime() - startB.getTime();
  });
  
  // Paginate the data
  const startIndex = currentPage * tasksPerPage;
  const endIndex = startIndex + tasksPerPage;
  const limitedTimelineData = sortedTimelineData.slice(startIndex, endIndex);
  const totalPages = Math.ceil(sortedTimelineData.length / tasksPerPage);
  
  const ganttData = {
    labels: limitedTimelineData.map(item => `ID: ${item.Task} (${item.Resource})`),
    datasets: [
      {
        label: 'Task Duration',
        data: limitedTimelineData.map(item => {
          const start = new Date(item.Start);
          const end = new Date(item.Finish);
          const duration = end.getTime() - start.getTime();
          return {
            x: start,
            y: duration / (1000 * 60 * 60 * 24), // Convert to days
            task: item.Task,
            resource: item.Resource,
            hours: item.Hours,
            group: item.dev_group,
            startDate: start,
            endDate: end
          };
        }),
        backgroundColor: limitedTimelineData.map((_, index) => 
          `hsl(${(index * 137.5) % 360}, 70%, 60%)`
        ),
        borderColor: limitedTimelineData.map((_, index) => 
          `hsl(${(index * 137.5) % 360}, 70%, 40%)`
        ),
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  // Simple Gantt data for when timeline data is not available - also limited
  const maxSimpleTasksToShow = 20;
  const limitedData = data.slice(0, maxSimpleTasksToShow);
  
  const simpleGanttData = {
    labels: limitedData.map((item, index) => `ID: ${item.ID || `Task_${index}`} (${item[planConfig.resource_col] || 'Unassigned'})`),
    datasets: [
      {
        label: 'Task Hours',
        data: limitedData.map((item, index) => ({
          x: index, // Use index as position
          y: Number(item[planConfig.hours_col]) || 8,
          task: item.ID || `Task_${index}`,
          resource: item[planConfig.resource_col] || 'Unassigned',
          hours: Number(item[planConfig.hours_col]) || 8,
          group: item.grupo_dev || 'N/A'
        })),
        backgroundColor: limitedData.map((_, index) => 
          `hsl(${(index * 137.5) % 360}, 70%, 60%)`
        ),
        borderColor: limitedData.map((_, index) => 
          `hsl(${(index * 137.5) % 360}, 70%, 40%)`
        ),
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const ganttOptions = {
    indexAxis: 'x' as const, // Vertical bar chart (traditional timeline)
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: `Task Timeline by ID (${planConfig.resource_title})`,
      },
      tooltip: {
        callbacks: {
          title: (context: any) => {
            const data = context[0].raw;
            return `Task ID: ${data.task} (${data.resource})`;
          },
          label: (context: any) => {
            const data = context.raw;
            if (data.startDate && data.endDate) {
              const startDate = data.startDate.toLocaleDateString();
              const endDate = data.endDate.toLocaleDateString();
              const duration = Math.ceil(data.y);
              return [
                `Task ID: ${data.task}`,
                `ABAP: ${data.resource}`,
                `Start: ${startDate}`,
                `End: ${endDate}`,
                `Duration: ${duration} days`,
                `Hours: ${data.hours}`,
                `Group: ${data.group}`
              ];
            } else {
              return [
                `Task ID: ${data.task}`,
                `ABAP: ${data.resource}`,
                `Hours: ${data.hours}`,
                `Group: ${data.group}`,
                `Position: ${data.x + 1}`
              ];
            }
          },
        },
      },
    },
    scales: {
      x: limitedTimelineData.length > 0 ? {
        type: 'time' as const,
        time: {
          unit: 'day' as const,
          displayFormats: {
            day: 'MMM dd',
          },
        },
        title: {
          display: true,
          text: 'Timeline',
        },
        ticks: {
          maxTicksLimit: 10,
        },
      } : {
        title: {
          display: true,
          text: 'Task Position',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Task IDs',
        },
        ticks: {
          maxTicksLimit: 15 // Limit number of y-axis labels
        }
      },
    },
    layout: {
      padding: {
        top: 20,
        bottom: 20,
        left: 20,
        right: 20
      }
    }
  };

  // Simple loading state
  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="text-center">
          <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Loading Timeline...</h3>
          <p className="text-gray-500 dark:text-gray-400">Preparing timeline view</p>
        </div>
      </div>
    );
  }

  // No data state
  if (timelineData.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="text-center">
          <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Timeline Data</h3>
          <p className="text-gray-500 dark:text-gray-400">
            {data.length > 0 
              ? `Data available but missing date columns. Found columns: ${Object.keys(data[0] || {}).join(', ')}`
              : 'Upload CSV data and assign resources to see the timeline'
            }
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

  // Calculate total hours safely
  const totalHours = timelineData.reduce((sum, item) => {
    const hours = Number(item.Hours) || 0;
    return sum + hours;
  }, 0);

  // View toggle component
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
    if (timelineData.length > 0) {
      // Full timeline Gantt - Microsoft Project style
      const earliestDate = new Date(Math.min(...limitedTimelineData.map(item => new Date(item.Start).getTime())));
      const latestDate = new Date(Math.max(...limitedTimelineData.map(item => new Date(item.Finish).getTime())));
      const totalDays = Math.ceil((latestDate.getTime() - earliestDate.getTime()) / (1000 * 60 * 60 * 24));
      
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
        const optimalWidth = Math.max(3, Math.min(6, Math.floor(availableWidth / dateHeaders.length)));
        return optimalWidth;
      };

      // Use calculated width if columnWidth is 4 (default), otherwise use user selection
      const effectiveColumnWidth = columnWidth === 4 ? calculateOptimalColumnWidth() : columnWidth;

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
              <p>Showing {visibleDateHeaders.length} days from {earliestDate.toLocaleDateString()} to {latestDate.toLocaleDateString()}</p>
              <p>Column width: {effectiveColumnWidth * 4}px (calculated: {effectiveColumnWidth}px base)</p>
              <p>Total timeline span: {totalDays} days</p>
              {isMobile && (
                <p className="text-blue-600 dark:text-blue-400 font-medium">
                  📱 Mobile view: Showing first 14 days for better readability
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2 mb-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">Tasks per page:</label>
            <select
              value={tasksPerPage}
              onChange={(e) => {
                const value = Number(e.target.value);
                setTasksPerPage(value);
                setCurrentPage(0);
                if (typeof window !== 'undefined') {
                  localStorage.setItem('timeline-tasks-per-page', String(value));
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
                <div className="w-28 p-0 bg-gray-50 dark:bg-gray-700 border-r border-gray-200 dark:border-gray-600 font-medium text-xs text-gray-700 dark:text-gray-300 flex-shrink-0 flex items-center justify-start" style={{ minWidth: '7rem', height: '24px' }}>
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
                      style={{ width: `${effectiveColumnWidth * 4}px`, minWidth: `${effectiveColumnWidth * 4}px` }}
                    >
                      <span style={{ fontSize: '10px', lineHeight: '12px', display: 'block', margin: 0, textAlign: 'center' }}>{date.getDate()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Task Rows */}
              {timelineData.map((item, index) => {
                const taskStart = new Date(item.Start);
                const taskEnd = new Date(item.Finish);
                // Calcular días hábiles entre start y end
                const businessDays: number[] = [];
                for (let i = 0; i < dateHeaders.length; i++) {
                  const d = dateHeaders[i];
                  if (d >= taskStart && d <= taskEnd && d.getDay() !== 0 && d.getDay() !== 6) {
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
                      <div className="font-medium text-gray-900 dark:text-white leading-[1] m-0 p-0" style={{ fontSize: '9px' }}>
                        {String(item.Task)}
                      </div>
                    </div>

                    {/* Timeline Cells */}
                    <div className="flex flex-1 min-w-0">
                      {visibleDateHeaders.map((date, dateIndex) => {
                        // Solo pintar barra en días hábiles de la tarea
                        const isTaskDay = businessDays.includes(dateIndex);
                        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                        
                        return (
                          <div 
                            key={dateIndex}
                            className={`h-6 border-r border-gray-200 dark:border-gray-600 relative flex-shrink-0 ${
                              isWeekend ? 'bg-red-50 dark:bg-red-900/20' : 'bg-white dark:bg-gray-800'
                            }`}
                            style={{ width: `${effectiveColumnWidth * 4}px`, minWidth: `${effectiveColumnWidth * 4}px` }}
                          >
                            {isTaskDay && (
                              <div 
                                className="absolute inset-0 rounded-sm opacity-80"
                                style={{ backgroundColor: getABAPColor(item.Resource) }}
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