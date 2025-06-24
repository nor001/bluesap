import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppState, FilterState, MetricsData, TimelineData, CSVMetadata } from './types';

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
          throw error;
        }
      },

      updateFilters: (filters: Partial<FilterState>) => {
        set((state) => ({
          filters: { ...state.filters, ...filters }
        }));
      },

      setPlanType: (planType: string) => {
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
          const result = await response.json();

          if (result.success && result.metadata) {
            set({ csvMetadata: result.metadata });
          }
        } catch (error) {
          throw error;
        }
      },

      setCSVMetadata: (metadata: CSVMetadata) => {
        set({ csvMetadata: metadata });
      },

      // Sync data to Supabase when available
      syncToSupabase: async () => {
        const { csvData } = get();
        
        if (!csvData || csvData.length === 0) {
          return false;
        }
        
        try {
          // Convert data back to CSV format
          const csvContent = [
            // Headers
            Object.keys(csvData[0] || {}).join(','),
            // Data rows
            ...csvData.map(row => 
              Object.values(row).map(value => 
                typeof value === 'string' && value.includes(',') ? `"${value}"` : value
              ).join(',')
            )
          ].join('\n');
          
          // Create a File object from the CSV content
          const blob = new Blob([csvContent], { type: 'text/csv' });
          const file = new File([blob], 'central.csv', { type: 'text/csv' });
          
          // Try to upload to Supabase
          const formData = new FormData();
          formData.append('csv', file);
          
          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });
          
          const result = await response.json();
          
          if (result.success) {
            // Data successfully synced to Supabase
            return true;
          }
        } catch (error) {
          // Supabase still not available, keep using fallback
        }
        
        return false;
      },
    }),
    {
      name: 'sap-gestion-storage',
      partialize: (state) => ({
        filters: state.filters,
        planType: state.planType,
        csvMetadata: state.csvMetadata,
      }),
    }
  )
); 