/**
 * Audited Fetch - Performance Auditing Implementation
 * Demonstrates the web development rule patterns for API optimization
 */

// ✅ RULE PATTERN: Performance Auditor Configuration
const AUDITOR_CONFIG = {
  DEBOUNCE_DELAY: 1000, // 1 second
  SLOW_CALL_THRESHOLD: 2000, // 2 seconds
  MAX_CALLS_PER_ENDPOINT: 5, // Max calls per endpoint per minute
  CLEANUP_INTERVAL: 5 * 60 * 1000 // 5 minutes
};

// ✅ RULE PATTERN: Performance Auditor Interface
interface PerformanceAuditor {
  shouldAllowCall(endpoint: string, method: string, component: string): boolean;
  recordCall(endpoint: string, method: string, component: string, data?: any): void;
  recordCompletion(endpoint: string, method: string, duration: number, success: boolean): void;
  getMetrics(): PerformanceMetrics;
  generateReport(): string;
  getRecentCalls(minutes?: number): APICall[];
}

interface PerformanceMetrics {
  totalCalls: number;
  slowCalls: number;
  failedCalls: number;
  averageResponseTime: number;
}

interface APICall {
  endpoint: string;
  method: string;
  component: string;
  timestamp: number;
  duration: number;
  success: boolean;
}

interface AuditedFetchOptions extends RequestInit {
  component: string;
  skipAudit?: boolean;
}

// ✅ RULE PATTERN: Performance Auditor Implementation
class PerformanceAuditorImpl implements PerformanceAuditor {
  private calls: APICall[] = [];
  private callCounts: Map<string, number> = new Map();
  private lastCleanup = Date.now();

  shouldAllowCall(endpoint: string, method: string, component: string): boolean {
    this.cleanup();
    
    const key = `${method}:${endpoint}`;
    const currentCount = this.callCounts.get(key) || 0;
    
    if (currentCount >= AUDITOR_CONFIG.MAX_CALLS_PER_ENDPOINT) {
      return false;
    }
    
    this.callCounts.set(key, currentCount + 1);
    return true;
  }

  recordCall(endpoint: string, method: string, component: string, data?: any): void {
    this.calls.push({
      endpoint,
      method,
      component,
      timestamp: Date.now(),
      duration: 0,
      success: false
    });
  }

  recordCompletion(endpoint: string, method: string, duration: number, success: boolean): void {
    const call = this.calls.find(c => 
      c.endpoint === endpoint && 
      c.method === method && 
      c.duration === 0
    );
    
    if (call) {
      call.duration = duration;
      call.success = success;
    }
  }

  getMetrics(): PerformanceMetrics {
    const completedCalls = this.calls.filter(c => c.duration > 0);
    
    return {
      totalCalls: completedCalls.length,
      slowCalls: completedCalls.filter(c => c.duration > AUDITOR_CONFIG.SLOW_CALL_THRESHOLD).length,
      failedCalls: completedCalls.filter(c => !c.success).length,
      averageResponseTime: completedCalls.length > 0 
        ? completedCalls.reduce((sum, c) => sum + c.duration, 0) / completedCalls.length 
        : 0
    };
  }

  generateReport(): string {
    const metrics = this.getMetrics();
    const recentCalls = this.getRecentCalls(5);
    
    return `
📊 Performance Report
====================
Total Calls: ${metrics.totalCalls}
Slow Calls (>${AUDITOR_CONFIG.SLOW_CALL_THRESHOLD}ms): ${metrics.slowCalls}
Failed Calls: ${metrics.failedCalls}
Average Response Time: ${Math.round(metrics.averageResponseTime)}ms

Recent Calls (last 5 minutes):
${recentCalls.map(call => 
  `  ${call.method} ${call.endpoint} - ${call.duration}ms ${call.success ? '✅' : '❌'}`
).join('\n')}
    `.trim();
  }

  getRecentCalls(minutes: number = 5): APICall[] {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    return this.calls.filter(call => call.timestamp > cutoff);
  }

  private cleanup(): void {
    const now = Date.now();
    if (now - this.lastCleanup > AUDITOR_CONFIG.CLEANUP_INTERVAL) {
      this.calls = this.calls.filter(call => 
        now - call.timestamp < AUDITOR_CONFIG.CLEANUP_INTERVAL
      );
      this.callCounts.clear();
      this.lastCleanup = now;
    }
  }
}

// ✅ RULE PATTERN: Global Performance Auditor Instance
const performanceAuditor = new PerformanceAuditorImpl();

// ✅ RULE PATTERN: Audited Fetch Implementation
export async function auditedFetch<T = any>(
  url: string,
  options: AuditedFetchOptions
): Promise<T> {
  const { component, skipAudit = false, ...fetchOptions } = options;
  const method = fetchOptions.method || 'GET';
  
  // ALWAYS audit the API call first
  if (!skipAudit && !performanceAuditor.shouldAllowCall(url, method, component)) {
    throw new Error(`API call blocked by performance auditor: ${method} ${url}`);
  }

  // ALWAYS record the call for tracking
  performanceAuditor.recordCall(url, method, component, fetchOptions.body);

  const startTime = Date.now();
  let success = false;

  try {
    const response = await fetch(url, fetchOptions);
    const data = await response.json();
    
    success = response.ok;
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    return data;
  } catch (error) {
    success = false;
    throw error;
  } finally {
    // ALWAYS record completion with timing
    const duration = Date.now() - startTime;
    performanceAuditor.recordCompletion(url, method, duration, success);
  }
}

// ✅ RULE PATTERN: Performance Debug Functions
export function getPerformanceReport(): string {
  return performanceAuditor.generateReport();
}

export function logPerformanceReport(): void {
  // Performance logging disabled
}

// ✅ RULE PATTERN: Export auditor for external use
export { performanceAuditor, AUDITOR_CONFIG };
export type { PerformanceMetrics, APICall, AuditedFetchOptions };

// Log performance report in development
if (process.env.NODE_ENV === 'development') {
  // Performance logging disabled
} 