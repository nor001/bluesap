'use client';

import { useMemo } from 'react';
import { FilterState } from '@/lib/types';
import { useAppStore } from '@/lib/store';

interface FiltersProps {
  data: any[];
  onFilterChange?: (filters: FilterState) => void;
}

export function Filters({ data, onFilterChange }: FiltersProps) {
  const { filters, updateFilters } = useAppStore();

  const filterOptions = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        proyOptions: ["Todos"],
        moduloOptions: ["Todos"],
        grupoOptions: ["Todos"]
      };
    }

    const proyOptions = ["Todos", ...Array.from(new Set(data.map(row => row.PROY).filter(Boolean))).sort()];
    const moduloOptions = ["Todos", ...Array.from(new Set(data.map(row => row.Módulo).filter(Boolean))).sort()];
    
    const grupoOptions = data.some(row => row.grupo_dev) 
      ? ["Todos", ...Array.from(new Set(data.map(row => row.grupo_dev).filter(Boolean))).sort()]
      : ["Todos"];

    return { proyOptions, moduloOptions, grupoOptions };
  }, [data]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    updateFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🔍 Filters</h3>
      
      <div className="space-y-4">
        {/* Project Filter */}
        <div>
          <label htmlFor="proy-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Project (PROY):
          </label>
          <select
            id="proy-filter"
            value={filters.selected_proy}
            onChange={(e) => handleFilterChange('selected_proy', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {filterOptions.proyOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        {/* Module Filter */}
        <div>
          <label htmlFor="modulo-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Module:
          </label>
          <select
            id="modulo-filter"
            value={filters.selected_modulo}
            onChange={(e) => handleFilterChange('selected_modulo', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {filterOptions.moduloOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        {/* Group Filter */}
        {filterOptions.grupoOptions.length > 1 && (
          <div>
            <label htmlFor="grupo-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Development Group:
            </label>
            <select
              id="grupo-filter"
              value={filters.selected_grupo}
              onChange={(e) => handleFilterChange('selected_grupo', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {filterOptions.grupoOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        )}

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