import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { calculateAssignments } from './assignment-calculator';
import { auditedFetch } from './auditedFetch';
import { logError } from './error-handler';
import { getFallbackData, isFallbackDataFresh } from './fallback-storage';
import {
    AppState,
    CSVMetadata,
    FilterState,
    MetricsData,
    TimelineData,
} from './types';
import { API_ROUTES } from './types/api-routes';

/**
 * Main store for SAP application state management
 * Manages global state of CSV data, assignments and filters
 * Special cases: Local persistence, fallback storage, and Supabase synchronization
 */
interface AppStore extends AppState {
  // Actions
  uploadCSV: (file: File) => Promise<void>;
  uploadParsedCSVData: (csvData: Array<Record<string, unknown>>) => Promise<void>;
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
  saveToCache: (
    data: Array<Record<string, unknown>>,
    metadata: Record<string, unknown>
  ) => void;
  clearCache: () => void;
}

const initialState: AppState = {
  csvData: [],
  assignedData: [],
  filters: {
    selectedProject: 'Todos',
    selectedModule: 'Todos',
    selectedGroup: 'Todos',
    functionalAssigned: 'Todos',
    idFilter: '',
  },
  loading: false,
  planType: 'abap',
  metrics: {
    totalProjects: 0,
    totalTasks: 0,
    assignedTasks: 0,
    unassignedTasks: 0,
  },
  timelineData: [],
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

export const createAppStore = () =>
  create<AppStore>()(
    persist(
      (set, get) => ({
        // Initial state
        csvData: [],
        assignedData: [],
        filters: initialState.filters,
        loading: false,
        planType: initialState.planType,
        metrics: initialState.metrics,
        timelineData: [],
        csvMetadata: undefined,

        // Actions
        uploadCSV: async (file: File) => {
          set({ loading: true });

          try {
            const formData = new FormData();
            formData.append('csv', file);

            const result = await auditedFetch<{
              success: boolean;
              data?: Array<Record<string, unknown>>;
              error?: string;
            }>(API_ROUTES.UPLOAD, { 
              method: 'POST', 
              body: formData, 
              component: 'Store.uploadCSV' 
            });

            if (result.success && result.data) {
              set({
                csvData: result.data,
                loading: false,
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
            logError(
              {
                type: 'processing',
                message: 'Upload failed',
                details: error,
                timestamp: Date.now(),
                userFriendly: true,
              },
              'Store.uploadCSV'
            );
            throw error;
          }
        },

        uploadParsedCSVData: async (csvData: Array<Record<string, unknown>>) => {
          set({ loading: true });

          try {
            const result = await auditedFetch<{
              success: boolean;
              data?: Array<Record<string, unknown>>;
              error?: string;
            }>(API_ROUTES.UPLOAD_PARSED, { 
              method: 'POST', 
              headers: { 'Content-Type': 'application/json' }, 
              body: JSON.stringify({ data: csvData }), 
              component: 'Store.uploadParsedCSVData' 
            });

            if (result.success && result.data) {
              set({
                csvData: result.data,
                loading: false,
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
            logError(
              {
                type: 'processing',
                message: 'Upload failed',
                details: error,
                timestamp: Date.now(),
                userFriendly: true,
              },
              'Store.uploadParsedCSV'
            );
            throw error;
          }
        },

        assignResources: async () => {
          const { csvData, planType, assignedData: _assignedData } = get();

          if (!csvData || csvData.length === 0) {
            return;
          }

          // Add debounce to prevent multiple rapid calls
          const now = Date.now();
          const DEBOUNCE_DELAY = 1000; // 1 second

          if (now - lastAssignCall < DEBOUNCE_DELAY) {
            return;
          }

          lastAssignCall = now;

          set({ loading: true });

          try {
            const assignedData = calculateAssignments(csvData, planType);
            set({
              assignedData,
              loading: false,
            });

            // Update metrics
            const metrics: MetricsData = {
              totalProjects: csvData.length,
              totalTasks: csvData.length,
              assignedTasks: assignedData.filter(
                (item: Record<string, unknown>) =>
                  item.abap_asignado &&
                  item.abap_asignado !== '' &&
                  item.abap_asignado !== 'None' &&
                  item.abap_asignado !== 'nan'
              ).length,
              unassignedTasks: assignedData.filter(
                (item: Record<string, unknown>) =>
                  !item.abap_asignado ||
                  item.abap_asignado === '' ||
                  item.abap_asignado === 'None' ||
                  item.abap_asignado === 'nan'
              ).length,
            };

            set({ metrics });
          } catch (error) {
            set({ loading: false });
            logError(
              {
                type: 'processing',
                message: 'Assignment failed',
                details: error,
                timestamp: Date.now(),
                userFriendly: true,
              },
              'Store.assignResources'
            );
            throw error;
          }
        },

        updateFilters: (filters: Partial<FilterState>) => {
          set((state) => ({
            filters: { ...state.filters, ...filters },
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
            metrics: initialState.metrics,
            timelineData: [],
            csvMetadata: undefined,
          });
        },

        fetchCSVMetadata: async () => {
          const now = Date.now();
          const DEBOUNCE_DELAY = 5000; // 5 seconds

          if (now - lastMetadataCall < DEBOUNCE_DELAY) {
            return;
          }

          lastMetadataCall = now;

          try {
            const result = await auditedFetch<{
              success: boolean;
              metadata?: CSVMetadata;
              error?: string;
            }>({ url: API_ROUTES.CSV_METADATA, method: 'GET', component: 'Store.fetchCSVMetadata' });

            if (result.success && result.metadata) {
              set({ csvMetadata: result.metadata });
            }
          } catch (error) {
            logError(
              {
                type: 'processing',
                message: 'Download failed',
                details: error,
                timestamp: Date.now(),
                userFriendly: true,
              },
              'Store.downloadCSV'
            );
          }
        },

        setCSVMetadata: (metadata: CSVMetadata) => {
          set({ csvMetadata: metadata });
        },

        syncToSupabase: async () => {
          const { assignedData } = get();

          if (!assignedData || assignedData.length === 0) {
            return false;
          }

          set({ loading: true });

          try {
            const result = await auditedFetch<{
              success: boolean;
              error?: string;
            }>({ url: API_ROUTES.SYNC_TO_SUPABASE, method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: assignedData }), component: 'Store.syncToSupabase' });

            set({ loading: false });
            return result.success;
          } catch (error) {
            set({ loading: false });
            logError(
              {
                type: 'processing',
                message: 'Supabase sync failed',
                details: error,
                timestamp: Date.now(),
                userFriendly: true,
              },
              'Store.syncToSupabase'
            );
            return false;
          }
        },

        loadFallbackData: () => {
          const fallbackData = getFallbackData();
          if (fallbackData && isFallbackDataFresh()) {
            set({
              csvData: fallbackData.csvData,
              assignedData: fallbackData.csvData,
            });
          }
        },

        setCSVData: (csvData: Array<Record<string, unknown>>) => {
          set({ csvData });
        },

        loadCachedData: () => {
          const cached = localStorage.getItem('bluesap_cached_data');
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              const { data, metadata, timestamp } = parsed;

              // Check if cache is fresh (24 hours)
              const isFresh = Date.now() - timestamp < 24 * 60 * 60 * 1000;

              if (isFresh && data && data.length > 0) {
                set({
                  csvData: data,
                  assignedData: data,
                  csvMetadata: metadata,
                });
                return true;
              }
            } catch (_error) {
              // Silently fail - cache is optional
            }
          }
          return false;
        },

        saveToCache: (
          data: Array<Record<string, unknown>>,
          metadata: Record<string, unknown>
        ) => {
          try {
            const cacheData = {
              data,
              metadata,
              timestamp: Date.now(),
            };
            localStorage.setItem('bluesap_cached_data', JSON.stringify(cacheData));
          } catch (_error) {
            // Silently fail - cache is optional
          }
        },

        clearCache: () => {
          try {
            localStorage.removeItem('bluesap_cached_data');
          } catch (_error) {
            // Silently fail
          }
        },
      }),
      {
        name: 'bluesap-store',
        partialize: (state) => ({
          filters: state.filters,
          planType: state.planType,
        }),
      }
    )
  );
