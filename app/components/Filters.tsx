'use client';

import { useMemo } from 'react';
import { FilterState } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { CSV_COLUMNS } from '@/lib/types/csv-columns';

interface FiltersProps {
  data: Array<{
    [CSV_COLUMNS.PROJECT]?: string;
    [CSV_COLUMNS.MODULE]?: string;
    [CSV_COLUMNS.GROUP]?: string;
  }>;
  onFilterChange?: (filters: FilterState) => void;
}

export function Filters({ data, onFilterChange }: FiltersProps) {
  const { filters, updateFilters } = useAppStore();

  const filterOptions = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        projectOptions: ['Todos'],
        moduleOptions: ['Todos'],
        groupOptions: ['Todos'],
      };
    }

    const projectOptions = [
      'Todos',
      ...Array.from(new Set(data.map(row => row[CSV_COLUMNS.PROJECT]).filter(Boolean))).sort(),
    ];
    const moduleOptions = [
      'Todos',
      ...Array.from(
        new Set(data.map(row => row[CSV_COLUMNS.MODULE]).filter(Boolean))
      ).sort(),
    ];

    const groupOptions = data.some(row => row[CSV_COLUMNS.GROUP])
      ? [
          'Todos',
          ...Array.from(
            new Set(data.map(row => row[CSV_COLUMNS.GROUP]).filter(Boolean))
          ).sort(),
        ]
      : ['Todos'];

    return { projectOptions, moduleOptions, groupOptions };
  }, [data]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    updateFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        🔍 Filters
      </h3>

      <div className="space-y-4">
        {/* Project Filter */}
        <div>
          <label
            htmlFor="project-filter"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Project:
          </label>
          <select
            id="project-filter"
            value={filters.selectedProject}
            onChange={e => handleFilterChange('selectedProject', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {filterOptions.projectOptions.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        {/* Module Filter */}
        <div>
          <label
            htmlFor="module-filter"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Module:
          </label>
          <select
            id="module-filter"
            value={filters.selectedModule}
            onChange={e => handleFilterChange('selectedModule', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {filterOptions.moduleOptions.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        {/* Group Filter */}
        {filterOptions.groupOptions.length > 1 && (
          <div>
            <label
              htmlFor="group-filter"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Development Group:
            </label>
            <select
              id="group-filter"
              value={filters.selectedGroup}
              onChange={e => handleFilterChange('selectedGroup', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {filterOptions.groupOptions.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* ID Filter */}
        <div>
          <label
            htmlFor="id-filter"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            ID Filter:
          </label>
          <input
            type="text"
            id="id-filter"
            value={filters.idFilter}
            onChange={e => handleFilterChange('idFilter', e.target.value)}
            placeholder="Enter ID to filter..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {/* Reload Button */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
          <button
            onClick={() => {
              // Clear all data and reload
              window.location.reload();
            }}
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-800"
          >
            🔄 Reload File
          </button>
        </div>
      </div>
    </div>
  );
}
