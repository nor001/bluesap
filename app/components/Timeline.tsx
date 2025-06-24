'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { TimelineData, PlanConfig } from '@/lib/types';
import { AppConfig } from '@/lib/config';

// Importación dinámica de Plotly para evitar errores de SSR
const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
      <div className="text-center">
        <div className="text-gray-400 text-6xl mb-4">📊</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Timeline...</h3>
        <p className="text-gray-500">Preparing interactive chart</p>
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
    if (!data || data.length === 0) return [];

    const ganttData: TimelineData[] = [];
    
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
      }
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
    
    const colorMap: Record<string, string> = {};
    Object.entries(resourceConfig).forEach(([resource, config]) => {
      colorMap[resource] = config.color;
    });

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
    height: 600,
    xaxis: {
      title: 'Date',
      type: 'date',
    },
    yaxis: {
      title: 'Tasks',
      autorange: 'reversed',
    },
    hovermode: 'closest',
    showlegend: true,
    legend: {
      orientation: 'h',
      y: -0.2,
    },
  }), [planConfig.resource_title]);

  const config = {
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
    responsive: true,
  };

  if (timelineData.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Timeline Data</h3>
          <p className="text-gray-500">Upload CSV data and assign resources to see the timeline</p>
        </div>
      </div>
    );
  }

  // Solo renderizar Plotly en el cliente
  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Timeline...</h3>
          <p className="text-gray-500">Preparing interactive chart</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
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