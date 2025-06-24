import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppState, FilterState, MetricsData, TimelineData, CSVMetadata } from './types';
import { AppConfig } from './config';
import { convertToSimpleCSV } from './csv-processor';
import { getFallbackData, isFallbackDataFresh } from './fallback-storage';
import { logError } from './error-handler';

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
}

const initialFilters: FilterState = {
  selected_proy: "Todos",
  selected_modulo: "Todos", 
  selected_grupo: "Todos"
};

const initialMetrics: MetricsData = {
  total_projects: 0,
  total_tasks: 0,
  assigned_tasks: 0,
  unassigned_tasks: 0
};

export const useAppStore = create<AppStore>()(
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
          
          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });
          
          const result = await response.json();
          
          if (result.success && result.data) {
            set({ 
              csvData: result.data,
              loading: false 
            });
            
            // Automatically assign resources after upload
            get().assignResources();
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
        const { csvData, planType } = get();
        
        if (!csvData || csvData.length === 0) {
          return;
        }
        
        set({ loading: true });
        
        try {
          const response = await fetch('/api/assign', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              data: csvData,
              planType: planType
            }),
          });
          
          const result = await response.json();
          
          if (result.success && result.data) {
            set({ 
              assignedData: result.data,
              loading: false 
            });
          } else {
            set({ loading: false });
            throw new Error(result.error || 'Assignment failed');
          }
        } catch (error) {
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
        try {
          const response = await fetch('/api/csv-metadata');
          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              set({ csvMetadata: result.metadata });
            }
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
              csvMetadata: fallbackData.metadata
            });
            
            // Trigger resource assignment if we have data
            if (fallbackData.csvData.length > 0) {
              setTimeout(() => {
                get().assignResources();
              }, 100);
            }
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

      // Sync data to Supabase when available
      syncToSupabase: async () => {
        const { csvData } = get();
        
        if (!csvData || csvData.length === 0) {
          return false;
        }
        
        try {
          // Use the dedicated sync endpoint
          const response = await fetch('/api/sync-to-supabase', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              data: csvData
            }),
          });
          
          const result = await response.json();
          
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
    }),
    {
      name: 'bluesap-store',
      partialize: (state) => ({
        filters: state.filters,
        planType: state.planType,
        metrics: state.metrics,
        timelineData: state.timelineData,
        csvMetadata: state.csvMetadata,
      }),
    }
  )
); 