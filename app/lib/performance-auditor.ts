/**
 * Performance Auditor - API Call Monitoring and Rate Limiting
 * Operational layer: Security-first, systematic handling
 */

interface APICall {
  endpoint: string;
  method: string;
  timestamp: number;
  component: string;
  data?: any;
}

interface PerformanceMetrics {
  totalCalls: number;
  duplicateCalls: number;
  averageResponseTime: number;
  slowCalls: number;
  errors: number;
}

class PerformanceAuditor {
  private static instance: PerformanceAuditor;
  private apiCalls: Map<string, APICall[]> = new Map();
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private metrics: PerformanceMetrics = {
    totalCalls: 0,
    duplicateCalls: 0,
    averageResponseTime: 0,
    slowCalls: 0,
    errors: 0
  };

  private readonly DEBOUNCE_DELAY = 1000; // 1 second
  private readonly SLOW_CALL_THRESHOLD = 2000; // 2 seconds
  private readonly MAX_CALLS_PER_ENDPOINT = 5; // Max calls per endpoint per minute

  private constructor() {}

  static getInstance(): PerformanceAuditor {
    if (!PerformanceAuditor.instance) {
      PerformanceAuditor.instance = new PerformanceAuditor();
    }
    return PerformanceAuditor.instance;
  }

  /**
   * Check if API call should be allowed (debounce + duplicate prevention)
   */
  shouldAllowCall(endpoint: string, method: string, component: string): boolean {
    const callKey = `${method}:${endpoint}`;
    const now = Date.now();
    
    // Check for existing calls in the last debounce period
    const recentCalls = this.apiCalls.get(callKey) || [];
    const recentCall = recentCalls.find(call => 
      now - call.timestamp < this.DEBOUNCE_DELAY && 
      call.component === component
    );

    if (recentCall) {
      this.metrics.duplicateCalls++;
      return false;
    }

    // Check for too many calls to the same endpoint
    const callsInLastMinute = recentCalls.filter(call => 
      now - call.timestamp < 60000
    );

    if (callsInLastMinute.length >= this.MAX_CALLS_PER_ENDPOINT) {
      return false;
    }

    return true;
  }

  /**
   * Record an API call
   */
  recordCall(endpoint: string, method: string, component: string, data?: any): void {
    const callKey = `${method}:${endpoint}`;
    const call: APICall = {
      endpoint,
      method,
      timestamp: Date.now(),
      component,
      data
    };

    if (!this.apiCalls.has(callKey)) {
      this.apiCalls.set(callKey, []);
    }

    this.apiCalls.get(callKey)!.push(call);
    this.metrics.totalCalls++;

    // Clean up old calls (older than 5 minutes)
    this.cleanupOldCalls();
  }

  /**
   * Record API call completion with timing
   */
  recordCompletion(endpoint: string, method: string, duration: number, success: boolean): void {
    if (!success) {
      this.metrics.errors++;
    }

    if (duration > this.SLOW_CALL_THRESHOLD) {
      this.metrics.slowCalls++;
    }

    // Update average response time
    this.updateAverageResponseTime(duration);
  }

  /**
   * Get performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get recent API calls for debugging
   */
  getRecentCalls(minutes: number = 5): APICall[] {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    const allCalls: APICall[] = [];
    
    for (const calls of this.apiCalls.values()) {
      allCalls.push(...calls.filter(call => call.timestamp > cutoff));
    }
    
    return allCalls.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Clear all data (useful for testing)
   */
  clear(): void {
    this.apiCalls.clear();
    this.debounceTimers.clear();
    this.metrics = {
      totalCalls: 0,
      duplicateCalls: 0,
      averageResponseTime: 0,
      slowCalls: 0,
      errors: 0
    };
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    const recentCalls = this.getRecentCalls();
    const duplicateRate = this.metrics.totalCalls > 0 
      ? ((this.metrics.duplicateCalls / this.metrics.totalCalls) * 100).toFixed(1)
      : '0';

    return `
📊 Performance Auditor Report
============================
Total API Calls: ${this.metrics.totalCalls}
Duplicate Calls Prevented: ${this.metrics.duplicateCalls} (${duplicateRate}%)
Average Response Time: ${this.metrics.averageResponseTime.toFixed(0)}ms
Slow Calls (>${this.SLOW_CALL_THRESHOLD}ms): ${this.metrics.slowCalls}
Errors: ${this.metrics.errors}

Recent Calls (last 5 minutes): ${recentCalls.length}
${recentCalls.slice(0, 10).map(call => 
  `  ${call.method} ${call.endpoint} (${call.component}) - ${new Date(call.timestamp).toLocaleTimeString()}`
).join('\n')}
    `.trim();
  }

  private cleanupOldCalls(): void {
    const cutoff = Date.now() - (5 * 60 * 1000); // 5 minutes
    
    for (const [key, calls] of this.apiCalls.entries()) {
      const filteredCalls = calls.filter(call => call.timestamp > cutoff);
      if (filteredCalls.length === 0) {
        this.apiCalls.delete(key);
      } else {
        this.apiCalls.set(key, filteredCalls);
      }
    }
  }

  private updateAverageResponseTime(duration: number): void {
    const total = this.metrics.averageResponseTime * (this.metrics.totalCalls - 1) + duration;
    this.metrics.averageResponseTime = total / this.metrics.totalCalls;
  }
}

// Export singleton instance
export const performanceAuditor = PerformanceAuditor.getInstance();

// Utility functions for easy integration
export function auditAPICall(endpoint: string, method: string, component: string, data?: any): boolean {
  return performanceAuditor.shouldAllowCall(endpoint, method, component);
}

export function recordAPICall(endpoint: string, method: string, component: string, data?: any): void {
  performanceAuditor.recordCall(endpoint, method, component, data);
}

export function recordAPICompletion(endpoint: string, method: string, duration: number, success: boolean): void {
  performanceAuditor.recordCompletion(endpoint, method, duration, success);
}

export function getPerformanceReport(): string {
  return performanceAuditor.generateReport();
}

// Debug function for development
export function logPerformanceReport(): void {
  if (process.env.NODE_ENV === 'development') {
    // Performance report logging disabled
  }
} 