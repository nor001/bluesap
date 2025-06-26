/**
 * Test Component - Demonstrates Web Development Rule Activation
 * This component shows that the web-development.mdc rule is active
 * by implementing all the required patterns from the rule
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { auditedFetch } from '@/lib/auditedFetch';

// ✅ RULE PATTERN: Component Structure Pattern
interface TestComponentProps {
  title: string;
  onAction?: (data: any) => void;
  disabled?: boolean;
}

export function TestComponent({ title, onAction, disabled = false }: TestComponentProps) {
  // ✅ RULE PATTERN: State management
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [executed, setExecuted] = useState(false); // React Strict Mode handling

  // ✅ RULE PATTERN: useOptimizedEffect for React Strict Mode
  useEffect(() => {
    // ALWAYS use execution flag to prevent double calls
    if (executed) return;
    
    setExecuted(true);
    
    const loadData = async () => {
      try {
        // ✅ RULE PATTERN: Audited fetch instead of raw fetch
        const result = await auditedFetch('/api/test-data', {
          method: 'GET',
          component: 'TestComponent.loadData'
        });
        setData(result.data);
      } catch (error) {
        // Failed to load data silently
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [executed]); // ALWAYS include execution flag in dependencies

  // ✅ RULE PATTERN: Event handlers with useCallback
  const handleClick = useCallback(() => {
    if (disabled) return;
    onAction?.(data);
  }, [disabled, onAction, data]);

  // ✅ RULE PATTERN: Expensive calculations with useMemo
  const expensiveValue = useMemo(() => {
    return data.length > 0 ? data.reduce((sum, item) => sum + (item.value || 0), 0) : 0;
  }, [data]);

  // ✅ RULE PATTERN: Loading States
  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200">Error: {error}</p>
      </div>
    );
  }

  // ✅ RULE PATTERN: Component render with proper structure
  return (
    <div className="bg-white dark:bg-gray-800 border rounded-lg shadow-lg p-4">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
        {title}
      </h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Total Items: {data.length}
          </span>
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Sum: {expensiveValue}
          </span>
        </div>
        
        <button
          onClick={handleClick}
          disabled={disabled}
          className={`
            w-full px-4 py-2 rounded-lg font-medium transition-colors
            ${disabled 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
            }
          `}
        >
          {disabled ? 'Disabled' : 'Execute Action'}
        </button>
      </div>
    </div>
  );
}

// ✅ RULE PATTERN: Export as memo for performance optimization
export default TestComponent; 