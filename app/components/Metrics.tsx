'use client';

import { MetricsData } from '@/lib/types';

interface MetricsProps {
  data: any[];
  planConfig: any;
}

export function Metrics({ data, planConfig }: MetricsProps) {
  const metrics: MetricsData = {
    total_projects: data.length > 0 ? new Set(data.map(row => row.PROY).filter(Boolean)).size : 0,
    total_tasks: data.length,
    assigned_tasks: data.filter(row => row[planConfig.resource_col] && row[planConfig.resource_col] !== '').length,
    unassigned_tasks: data.filter(row => !row[planConfig.resource_col] || row[planConfig.resource_col] === '').length,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {/* Total Projects */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 text-lg">🏢</span>
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Total Projects</p>
            <p className="text-2xl font-semibold text-gray-900">{metrics.total_projects}</p>
          </div>
        </div>
      </div>

      {/* Total Tasks */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600 text-lg">📋</span>
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Total Tasks</p>
            <p className="text-2xl font-semibold text-gray-900">{metrics.total_tasks}</p>
          </div>
        </div>
      </div>

      {/* Assigned Tasks */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-success-100 rounded-lg flex items-center justify-center">
              <span className="text-success-600 text-lg">✅</span>
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Assigned Tasks</p>
            <p className="text-2xl font-semibold text-gray-900">{metrics.assigned_tasks}</p>
          </div>
        </div>
      </div>

      {/* Unassigned Tasks */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-warning-100 rounded-lg flex items-center justify-center">
              <span className="text-warning-600 text-lg">⏳</span>
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Unassigned Tasks</p>
            <p className="text-2xl font-semibold text-gray-900">{metrics.unassigned_tasks}</p>
          </div>
        </div>
      </div>
    </div>
  );
} 