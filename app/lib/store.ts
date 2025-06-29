import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppState, FilterState, MetricsData, TimelineData, CSVMetadata } from './types';
import { getFallbackData, isFallbackDataFresh } from './fallback-storage';
import { logError } from './error-handler';
import { auditedFetch } from './auditedFetch';
import { calculateAssignments } from './assignment-calculator';
import { useCallback } from 'react';

interface AppStore extends AppState {
  // Actions
  uploadCSV: (file: File) => Promise<void>;
  assignResources: () => Promise<void>;
  updateFilters: (filters: Partial<FilterState>) => void;
  setPlanType: (planType: string) => void;
  setLoading: (loading: boolean) => void;
  setMetrics: (metrics: MetricsData) => void;
  setTimelineData: (data: TimelineData[]) => void;
  clearData: () => void;
  fetchCSVMetadata: () => Promise<void>;
  setCSVMetadata: (metadata: CSVMetadata) => void;
  syncToSupabase: () => Promise<boolean>;
  loadFallbackData: () => void;
  setCSVData: (csvData: Array<Record<string, unknown>>) => void;
  loadCachedData: () => boolean;
  saveToCache: (data: Array<Record<string, unknown>>, metadata: Record<string, unknown>) => void;
  clearCache: () => void;
}

const initialFilters: FilterState = {
  selected_proy: "Todos",
  selected_modulo: "Todos", 
  selected_grupo: "Todos",
  id_filter: "",
  consultor_ntt: "Todos"
};

const initialMetrics: MetricsData = {
  total_projects: 0,
  total_tasks: 0,
  assigned_tasks: 0,
  unassigned_tasks: 0
};

// Debounce mechanism for API calls
let lastMetadataCall = 0;
let lastAssignCall = 0;

// Lazy initialization for better performance
let storeInstance: ReturnType<typeof createAppStore> | null = null;

export const useAppStore = () => {
  if (!storeInstance) {
    storeInstance = createAppStore();
  }
  return storeInstance();
};

export const createAppStore = () => create<AppStore>()(
  persist(
    (set, get) => ({
      // Initial state
      csvData: [],
      assignedData: [],
      filters: initialFilters,
      loading: false,
      planType: "Plan de Desarrollo",
      metrics: initialMetrics,
      timelineData: [],
      csvMetadata: undefined,

      // Actions
      uploadCSV: async (file: File) => {
        set({ loading: true });
        
        try {
          const formData = new FormData();
          formData.append('csv', file);
          
          const result = await auditedFetch<{ success: boolean; data?: Array<Record<string, unknown>>; error?: string }>('/api/upload', {
            method: 'POST',
            body: formData,
            component: 'Store.uploadCSV'
          });
          
          if (result.success && result.data) {
            set({ 
              csvData: result.data,
              loading: false 
            });
            
            // Automatically assign resources after upload (with debounce)
            setTimeout(() => {
              get().assignResources();
            }, 100);
          } else {
            set({ loading: false });
            throw new Error(result.error || 'Upload failed');
          }
        } catch (error) {
          set({ loading: false });
          logError({
            type: 'processing',
            message: 'Upload failed',
            details: error,
            timestamp: Date.now(),
            userFriendly: true
          }, 'Store');
          throw error;
        }
      },

      assignResources: async () => {
        const { csvData, planType, assignedData } = get();
        
        console.log('🔄 assignResources called', { 
          csvDataLength: csvData?.length || 0, 
          planType, 
          currentAssignedLength: assignedData?.length || 0 
        });
        
        if (!csvData || csvData.length === 0) {
          console.log('❌ No CSV data available for assignment');
          return;
        }

        // Add debounce to prevent multiple rapid calls
        const now = Date.now();
        const DEBOUNCE_DELAY = 1000; // 1 second

        if (now - lastAssignCall < DEBOUNCE_DELAY) {
          console.log('⏳ Debounced assignment call');
          return;
        }

        lastAssignCall = now;
        
        set({ loading: true });
        
        try {
          console.log('🔄 Starting assignment calculation...');
          // Use local calculation instead of API call
          const newAssignedData = calculateAssignments(csvData, planType);
          
          console.log('✅ Assignment calculation completed', { 
            newAssignedDataLength: newAssignedData?.length || 0,
            sampleAssigned: newAssignedData?.[0]
          });
          
          set({ 
            assignedData: newAssignedData,
            loading: false 
          });
          
          // Verify the state was updated
          const updatedState = get();
          console.log('✅ State updated', { 
            newAssignedLength: updatedState.assignedData?.length || 0 
          });
        } catch (error) {
          console.error('❌ Assignment failed:', error);
          set({ loading: false });
          logError({
            type: 'processing',
            message: 'Resource assignment failed',
            details: error,
            timestamp: Date.now(),
            userFriendly: true
          }, 'Store');
          throw error;
        }
      },

      updateFilters: (newFilters) => {
        set((state) => ({
          filters: { ...state.filters, ...newFilters }
        }));
      },

      setPlanType: (planType) => {
        set({ planType });
      },

      setLoading: (loading: boolean) => {
        set({ loading });
      },

      setMetrics: (metrics: MetricsData) => {
        set({ metrics });
      },

      setTimelineData: (data: TimelineData[]) => {
        set({ timelineData: data });
      },

      clearData: () => {
        set({
          csvData: [],
          assignedData: [],
          timelineData: [],
          metrics: initialMetrics,
          csvMetadata: undefined,
        });
      },

      fetchCSVMetadata: async () => {
        // Add debounce to prevent multiple rapid calls
        const now = Date.now();
        const DEBOUNCE_DELAY = 1000; // 1 second

        if (now - lastMetadataCall < DEBOUNCE_DELAY) {
          return;
        }

        lastMetadataCall = now;

        try {
          const result = await auditedFetch<{ success: boolean; metadata?: CSVMetadata }>('/api/csv-metadata', {
            method: 'GET',
            component: 'Store.fetchCSVMetadata'
          });
          
          if (result.success && result.metadata) {
            set({ csvMetadata: result.metadata });
          }
        } catch (error) {
          // Silently fail - metadata is optional
          logError({
            type: 'network',
            message: 'Failed to fetch CSV metadata',
            details: error,
            timestamp: Date.now(),
            userFriendly: false
          }, 'Store');
        }
      },

      setCSVMetadata: (metadata: CSVMetadata) => {
        set({ csvMetadata: metadata });
      },

      // Load fallback data if available and fresh
      loadFallbackData: () => {
        try {
          const fallbackData = getFallbackData();
          
          if (fallbackData && isFallbackDataFresh()) {
            set({ 
              csvData: fallbackData.csvData,
              csvMetadata: fallbackData.metadata as unknown as CSVMetadata | undefined
            });
            
            // Don't trigger resource assignment here - let the page useEffect handle it
            // This prevents duplicate calls
          }
        } catch (error) {
          logError({
            type: 'storage',
            message: 'Failed to load fallback data',
            details: error,
            timestamp: Date.now(),
            userFriendly: false
          }, 'Store');
        }
      },

      // Load cached data from localStorage
      loadCachedData: () => {
        try {
          if (typeof window === 'undefined') {
            return false;
          }
          
          const cached = localStorage.getItem('bluesap-csv-cache');
          
          if (!cached) {
            return false;
          }
          
          const { data, metadata, timestamp } = JSON.parse(cached);
          const now = Date.now();
          const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes (increased from 5)
          
          if (now - timestamp < CACHE_DURATION && data && data.length > 0) {
            set({ csvData: data, csvMetadata: metadata });
            return true;
          } else {
            // Clear expired cache
            localStorage.removeItem('bluesap-csv-cache');
            return false;
          }
        } catch {
          // Clear corrupted cache
          if (typeof window !== 'undefined') {
            localStorage.removeItem('bluesap-csv-cache');
          }
          return false;
        }
      },

      // Save data to cache
      saveToCache: (data: Array<Record<string, unknown>>, metadata: Record<string, unknown>) => {
        try {
          if (typeof window === 'undefined') return;
          
          const cacheData = {
            data,
            metadata,
            timestamp: Date.now()
          };
          
          localStorage.setItem('bluesap-csv-cache', JSON.stringify(cacheData));
        } catch {
          // Silently fail - cache is optional
        }
      },

      // Clear cache
      clearCache: () => {
        try {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('bluesap-csv-cache');
          }
        } catch {
          // Silently fail
        }
      },

      // Sync data to Supabase when available
      syncToSupabase: async () => {
        const { csvData } = get();
        
        if (!csvData || csvData.length === 0) {
          return false;
        }
        
        try {
          // Use the dedicated sync endpoint
          const result = await auditedFetch<{ success: boolean }>('/api/sync-to-supabase', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              data: csvData
            }),
            component: 'Store.syncToSupabase'
          });
          
          if (result.success) {
            // Data successfully synced to Supabase
            return true;
          }
        } catch (error) {
          // Supabase still not available, keep using fallback
          logError({
            type: 'network',
            message: 'Supabase sync failed',
            details: error,
            timestamp: Date.now(),
            userFriendly: false
          }, 'Store');
        }
        
        return false;
      },

      setCSVData: (csvData) => {
        set({ csvData });
      },

      // Rehydration callback
      onRehydrateStorage: () => (_state: unknown) => {
        // Store rehydrated successfully
      },
    }),
    {
      name: 'bluesap-store',
      partialize: (state) => ({
        filters: state.filters,
        planType: state.planType,
        metrics: state.metrics,
        timelineData: state.timelineData,
        csvMetadata: state.csvMetadata,
        assignedData: state.assignedData,
      }),
    }
  )
); 