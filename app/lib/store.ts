import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppState, FilterState, MetricsData, TimelineData } from './types';

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

          if (result.success) {
            set({ 
              csvData: result.data || [],
              loading: false 
            });
          } else {
            throw new Error(result.error || 'Upload failed');
          }
        } catch (error) {
          console.error('Upload error:', error);
          set({ loading: false });
          throw error;
        }
      },

      assignResources: async () => {
        const { csvData, planType } = get();
        if (csvData.length === 0) return;

        set({ loading: true });
        try {
          const response = await fetch('/api/assign', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              data: csvData,
              planType: planType,
            }),
          });

          const result = await response.json();

          if (result.success) {
            set({ 
              assignedData: result.data || [],
              loading: false 
            });
          } else {
            throw new Error(result.error || 'Assignment failed');
          }
        } catch (error) {
          console.error('Assignment error:', error);
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
        });
      },
    }),
    {
      name: 'sap-gestion-storage',
      partialize: (state) => ({
        filters: state.filters,
        planType: state.planType,
      }),
    }
  )
); 