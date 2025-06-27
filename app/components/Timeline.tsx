'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { TimelineData, PlanConfig } from '@/lib/types';
import { AppConfig } from '@/lib/config';

// Importación dinámica de Plotly para evitar errores de SSR
const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="text-center">
        <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">📊</div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Loading Timeline...</h3>
        <p className="text-gray-500 dark:text-gray-400">Preparing interactive chart</p>
      </div>
    </div>
  ),
});

interface TimelineProps {
  data: any[];
  planConfig: PlanConfig;
  extraHoverCols?: string[];
  preciseHours?: boolean;
}

export function Timeline({ data, planConfig, extraHoverCols = [], preciseHours = false }: TimelineProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const timelineData = useMemo(() => {
    if (!data || data.length === 0) {
      return [];
    }

    const ganttData: TimelineData[] = [];
    let processedCount = 0;
    let skippedCount = 0;
    
    for (const row of data) {
      const startDate = row[planConfig.start_date_col];
      const endDate = row[planConfig.end_date_col];
      const resource = row[planConfig.resource_col];
      
      if (startDate && endDate && resource) {
        let start = new Date(startDate);
        let end = new Date(endDate);
        
        // If precise_hours, set start to 09:00 and end to 18:00 for the last day
        if (preciseHours) {
          start = new Date(start);
          start.setHours(9, 0, 0, 0);
          
          end = new Date(end);
          end.setHours(18, 0, 0, 0);
        }
        
        const timelineItem: TimelineData = {
          Task: row.ID || `Task_${ganttData.length}`,
          Start: start.toISOString(),
          Finish: end.toISOString(),
          Resource: resource,
          Hours: row[planConfig.hours_col] || 8.0,
          dev_group: String(row.grupo_dev || 'N/A'),
          ...(extraHoverCols.reduce((acc, col) => {
            acc[col] = row[col] || '';
            return acc;
          }, {} as Record<string, any>))
        };
        
        ganttData.push(timelineItem);
        processedCount++;
      } else {
        skippedCount++;
      }
    }

    // Add unassigned tasks at the end
    const unassignedTasks = data.filter(row => {
      const startDate = row[planConfig.start_date_col];
      const endDate = row[planConfig.end_date_col];
      const resource = row[planConfig.resource_col];
      
      return !startDate || !endDate || !resource || 
             resource === '' || resource === 'None' || resource === 'nan';
    });

    // Add unassigned tasks as a special section
    if (unassignedTasks.length > 0) {
      const baseDate = new Date();
      baseDate.setHours(9, 0, 0, 0);
      
      unassignedTasks.forEach((row, index) => {
        const hours = row[planConfig.hours_col] || 8.0;
        const start = new Date(baseDate);
        start.setDate(start.getDate() + index);
        
        const end = new Date(start);
        end.setDate(end.getDate() + Math.max(1, Math.ceil(hours / 8)));
        
        const timelineItem: TimelineData = {
          Task: `${row.ID || `Task_${ganttData.length + index}`} (PENDIENTE)`,
          Start: start.toISOString(),
          Finish: end.toISOString(),
          Resource: 'TAREAS PENDIENTES',
          Hours: hours,
          dev_group: String(row.grupo_dev || 'N/A'),
          ...(extraHoverCols.reduce((acc, col) => {
            acc[col] = row[col] || '';
            return acc;
          }, {} as Record<string, any>))
        };
        
        ganttData.push(timelineItem);
      });
    }
    
    return ganttData;
  }, [data, planConfig, extraHoverCols, preciseHours]);

  const plotData = useMemo(() => {
    if (timelineData.length === 0) {
      return [{
        type: 'scatter',
        mode: 'text',
        x: [new Date()],
        y: ['No data available'],
        text: ['No data available'],
        textposition: 'middle center',
        showlegend: false,
      }];
    }

    // Get color mapping from resource configuration
    let resourceConfig: Record<string, any>;
    if (planConfig.resource_title.includes('Developer')) {
      resourceConfig = AppConfig.getAllDevelopersConfig();
    } else {
      resourceConfig = AppConfig.TESTERS_CONFIG;
    }
    
    // Create color mapping for all resources including dynamic ones
    const colorMap: Record<string, string> = {};
    const colors = [
      "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7",
      "#A3E4DB", "#FFD6E0", "#B5EAD7", "#FFDAC1", "#E2F0CB",
      "#C7CEEA", "#FFF1BA", "#B5D8FA", "#FFB7B2", "#D4A5A5",
      "#9B59B6", "#3498DB", "#E67E22", "#F39C12", "#1ABC9C",
      "#E74C3C", "#2ECC71", "#9B59B6", "#34495E", "#16A085"
    ];
    
    // First, add colors for static resources
    Object.entries(resourceConfig).forEach(([resource, config]) => {
      colorMap[resource] = config.color;
    });
    
    // Then, add colors for dynamic resources (Senior_01, Senior_02, etc.)
    const allResources = [...new Set(timelineData.map(item => item.Resource))];
    let dynamicIndex = 0;
    
    allResources.forEach(resource => {
      if (!colorMap[resource]) {
        // This is a dynamic resource, assign a color
        const colorIndex = dynamicIndex % colors.length;
        colorMap[resource] = colors[colorIndex];
        dynamicIndex++;
      }
    });

    // Special color for pending tasks
    colorMap['TAREAS PENDIENTES'] = '#FF6B6B'; // Red color for pending tasks

    // Create hover columns
    const hoverCols = ['Hours', 'dev_group', ...extraHoverCols];

    // Group data by resource for Plotly
    const resources = [...new Set(timelineData.map(item => item.Resource))];
    
    return resources.map(resource => {
      const resourceData = timelineData.filter(item => item.Resource === resource);
      
      return {
        type: 'scatter',
        mode: 'lines+markers',
        x: resourceData.flatMap(item => [
          new Date(item.Start),
          new Date(item.Finish),
          null
        ]),
        y: resourceData.flatMap(item => [
          item.Task,
          item.Task,
          null
        ]),
        line: {
          color: colorMap[resource] || '#000000',
          width: 20
        },
        marker: {
          color: colorMap[resource] || '#000000',
          size: 8
        },
        name: resource,
        hovertemplate: 
          '<b>%{fullData.name}</b><br>' +
          'Task: %{y}<br>' +
          'Start: %{x}<br>' +
          '<extra></extra>',
        showlegend: true,
      };
    });
  }, [timelineData, planConfig, extraHoverCols]);

  const layout = useMemo(() => ({
    title: `📅 Planning Timeline (${planConfig.resource_title})`,
    height: 800,
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: {
      color: typeof window !== 'undefined' && document.documentElement.classList.contains('dark') ? '#ffffff' : '#000000'
    },
    xaxis: {
      title: 'Date',
      type: 'date',
      gridcolor: typeof window !== 'undefined' && document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb',
      color: typeof window !== 'undefined' && document.documentElement.classList.contains('dark') ? '#ffffff' : '#000000'
    },
    yaxis: {
      title: 'Tasks',
      autorange: 'reversed',
      gridcolor: typeof window !== 'undefined' && document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb',
      color: typeof window !== 'undefined' && document.documentElement.classList.contains('dark') ? '#ffffff' : '#000000'
    },
    hovermode: 'closest',
    showlegend: true,
    legend: {
      orientation: 'h',
      y: -0.2,
      font: {
        color: typeof window !== 'undefined' && document.documentElement.classList.contains('dark') ? '#ffffff' : '#000000'
      }
    },
  }), [planConfig.resource_title]);

  const config = {
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
    responsive: true,
  };

  // Force Plotly z-index after render
  useEffect(() => {
    if (isClient && timelineData.length > 0) {
      // Add a small delay to ensure Plotly has finished rendering
      const timer = setTimeout(() => {
        // Force all Plotly elements to have low z-index
        const plotlyElements = document.querySelectorAll('.js-plotly-plot, .plotly, .plotly .main-svg, .plotly .bglayer, .plotly .annotation');
        plotlyElements.forEach((element) => {
          if (element instanceof HTMLElement) {
            element.style.zIndex = '1';
          }
        });
        
        // Also force any elements with high z-index to be lower
        const highZIndexElements = document.querySelectorAll('[style*="z-index: 1000"], [style*="z-index: 1001"], [style*="z-index: 1002"], [style*="z-index: 1003"], [style*="z-index: 1004"], [style*="z-index: 1005"]');
        highZIndexElements.forEach((element) => {
          if (element instanceof HTMLElement) {
            element.style.zIndex = '1';
          }
        });
      }, 100); // 100ms delay
      
      return () => clearTimeout(timer);
    }
  }, [isClient, timelineData.length]);

  // Show data summary when data exists but timeline is empty
  if (data && data.length > 0 && timelineData.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="text-center">
          <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Data Available but No Timeline</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Found {data.length} rows, but no valid timeline data.
          </p>
          <div className="text-sm text-gray-600 dark:text-gray-400 text-left max-w-md mx-auto">
            <p><strong>Required columns:</strong></p>
            <ul className="list-disc list-inside mt-2">
              <li>Start Date: {planConfig.start_date_col}</li>
              <li>End Date: {planConfig.end_date_col}</li>
              <li>Resource: {planConfig.resource_col}</li>
              <li>Hours: {planConfig.hours_col}</li>
            </ul>
            <p className="mt-2">
              <strong>Available columns:</strong> {Object.keys(data[0] || {}).join(', ')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (timelineData.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="text-center">
          <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Timeline Data</h3>
          <p className="text-gray-500 dark:text-gray-400">Upload CSV data and assign resources to see the timeline</p>
        </div>
      </div>
    );
  }

  // Solo renderizar Plotly en el cliente
  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="text-center">
          <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Loading Timeline...</h3>
          <p className="text-gray-500 dark:text-gray-400">Preparing interactive chart</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full relative z-10">
      <Plot
        data={plotData}
        layout={layout}
        config={config}
        className="w-full"
        useResizeHandler={true}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
} 