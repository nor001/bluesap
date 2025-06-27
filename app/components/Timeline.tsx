'use client';

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

export function Timeline({ data, planConfig, extraHoverCols = [], preciseHours = false }: TimelineProps) {
  const [isClient, setIsClient] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');

  useEffect(() => {
    setIsClient(true);
  }, []);

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

  // Prepare chart data
  const chartData = {
    labels: timelineData.map(item => item.Task),
    datasets: [
      {
        label: 'Hours',
        data: timelineData.map(item => Number(item.Hours) || 0),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
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
          <p className="text-gray-500 dark:text-gray-400">Upload CSV data and assign resources to see the timeline</p>
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
        onClick={() => setViewMode('table')}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          viewMode === 'table'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
        }`}
      >
        📋 Table View
      </button>
      <button
        onClick={() => setViewMode('chart')}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          viewMode === 'chart'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
        }`}
      >
        📊 Chart View
      </button>
    </div>
  );

  // Table view component
  const TableView = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Planning Timeline ({planConfig.resource_title})
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Showing {timelineData.length} tasks
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Resource
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Task
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Start Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                End Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Hours
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Group
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {timelineData.slice(0, 20).map((item, index) => (
              <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {item.Resource}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {item.Task}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {new Date(item.Start).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {new Date(item.Finish).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {Number(item.Hours) || 0}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {item.dev_group}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-500 dark:text-gray-400">Total Tasks</p>
            <p className="font-semibold text-gray-900 dark:text-white">{timelineData.length}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Resources</p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {[...new Set(timelineData.map(item => item.Resource))].length}
            </p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Total Hours</p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {totalHours.toFixed(1)}
            </p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Status</p>
            <p className="font-semibold text-gray-900 dark:text-white">Active</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Chart view component
  const ChartView = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Timeline Chart ({planConfig.resource_title})
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Visual representation of task hours
        </p>
      </div>
      
      <div className="p-4">
        <div className="h-96">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>
      
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-500 dark:text-gray-400">Total Tasks</p>
            <p className="font-semibold text-gray-900 dark:text-white">{timelineData.length}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Resources</p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {[...new Set(timelineData.map(item => item.Resource))].length}
            </p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Total Hours</p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {totalHours.toFixed(1)}
            </p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Status</p>
            <p className="font-semibold text-gray-900 dark:text-white">Active</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full">
      <ViewToggle />
      {viewMode === 'table' ? <TableView /> : <ChartView />}
    </div>
  );
}
