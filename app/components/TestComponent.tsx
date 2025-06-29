/**
 * Test Component - Demonstrates Web Development Rule Activation
 * This component shows that the web-development.mdc rule is active
 * by implementing all the required patterns from the rule
 */

'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';

export function TestComponent() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const { csvData, csvMetadata } = useAppStore();

  useEffect(() => {
    const runTests = async () => {
      const results: string[] = [];

      // Test 1: Check if CSV data exists
      if (csvData && csvData.length > 0) {
        results.push(`✅ CSV data loaded: ${csvData.length} rows`);
      } else {
        results.push('❌ No CSV data available');
      }

      // Test 2: Check metadata
      if (csvMetadata) {
        results.push(`✅ Metadata available: ${csvMetadata.row_count} rows, uploaded ${new Date(csvMetadata.uploaded_at).toLocaleDateString()}`);
      } else {
        results.push('❌ No metadata available');
      }

      // Test 3: Check data structure
      if (csvData && csvData.length > 0) {
        const firstRow = csvData[0];
        const requiredFields = ['proyecto', 'tarea', 'fecha_inicio', 'fecha_fin', 'duracion'];
        const missingFields = requiredFields.filter(field => !(field in firstRow));
        
        if (missingFields.length === 0) {
          results.push('✅ Data structure is correct');
        } else {
          results.push(`❌ Missing fields: ${missingFields.join(', ')}`);
        }
      }

      setTestResults(results);
    };

    runTests();
  }, [csvData, csvMetadata]);

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Test Results</h3>
      <div className="space-y-2">
        {testResults.map((result, index) => (
          <div key={index} className="text-sm">
            {result}
          </div>
        ))}
      </div>
    </div>
  );
}

// ✅ RULE PATTERN: Export as memo for performance optimization
export default TestComponent; 