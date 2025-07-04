'use client';

import { MetricsData, PlanConfig } from '@/lib/types';
import { CSV_COLUMNS } from '@/lib/types/csv-columns';

interface MetricsProps {
  data: Array<Record<string, any>>;
  planConfig: PlanConfig;
}

export function Metrics({ data, planConfig }: MetricsProps) {
  const metrics: MetricsData = {
    totalProjects:
      data.length > 0
        ? new Set(data.map(row => row[CSV_COLUMNS.PROJECT]).filter(Boolean)).size
        : 0,
    totalTasks: data.length,
    assignedTasks: data.filter(
      row => row[planConfig.resource_col] && row[planConfig.resource_col] !== ''
    ).length,
    unassignedTasks: data.filter(
      row =>
        !row[planConfig.resource_col] || row[planConfig.resource_col] === ''
    ).length,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {/* Total Projects */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 dark:text-blue-400 text-lg">
                🏢
              </span>
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Total Projects
            </p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">
              {metrics.totalProjects}
            </p>
          </div>
        </div>
      </div>

      {/* Total Tasks */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <span className="text-green-600 dark:text-green-400 text-lg">
                📋
              </span>
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Total Tasks
            </p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">
              {metrics.totalTasks}
            </p>
          </div>
        </div>
      </div>

      {/* Assigned Tasks */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-success-100 dark:bg-success-900/30 rounded-lg flex items-center justify-center">
              <span className="text-success-600 dark:text-success-400 text-lg">
                ✅
              </span>
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Assigned Tasks
            </p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">
              {metrics.assignedTasks}
            </p>
          </div>
        </div>
      </div>

      {/* Unassigned Tasks */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-warning-100 dark:bg-warning-900/30 rounded-lg flex items-center justify-center">
              <span className="text-warning-600 dark:text-warning-400 text-lg">
                ⏳
              </span>
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Unassigned Tasks
            </p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">
              {metrics.unassignedTasks}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
