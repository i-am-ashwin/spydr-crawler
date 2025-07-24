import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { CrawlStore, CrawlJob, PaginationParams, ApiError } from './types';
import { 
  createCrawlJobApi, 
  getCrawlJobApi, 
  listCrawlJobsApi, 
  stopCrawlJobApi, 
  deleteCrawlJobApi 
} from './api';
import { createSSEManager } from './sse';
import { createSelectors, CrawlStoreSelectors } from './selectors';

// Create SSE manager instance
const sseManager = createSSEManager();

export const useCrawlStore = create<CrawlStore>()(
  devtools(
    (set, get) => ({
      // Initial State
      jobs: [],
      isLoading: false,
      error: null,
      sseConnected: false,
      abortController: null,
      totalJobs: 0,
      currentPage: 0,
      pageSize: 10,

      createCrawlJob: async (url: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const job = await createCrawlJobApi(url);

          set(state => ({
            jobs: [job, ...state.jobs],
            isLoading: false,
          }));

          return job;
        } catch (error) {
          const apiError: ApiError = { message: (error as Error).message };
          set({ error: apiError, isLoading: false });
          throw error;
        }
      },

      getCrawlJob: async (id: number) => {
        // First, try to get the job from the store (SSE data)
        const existingJob = get().jobs.find(job => job.id === id);
        if (existingJob) {
          // Return the SSE version immediately, but still fetch fresh data
          setTimeout(async () => {
            try {
              const freshJob = await getCrawlJobApi(id);
              const { upsertJobFromSSE } = get();
              upsertJobFromSSE(freshJob);
            } catch (error) {
              console.warn('Failed to fetch fresh job data:', error);
            }
          }, 0);
          
          return existingJob;
        }

        // If not in store, fetch from API
        set({ isLoading: true, error: null });
        
        try {
          const job = await getCrawlJobApi(id);
          
          // Add the job to the store
          set(state => ({
            jobs: state.jobs.some(j => j.id === id) 
              ? state.jobs.map(j => j.id === id ? job : j)
              : [...state.jobs, job],
            isLoading: false,
          }));

          return job;
        } catch (error) {
          const apiError: ApiError = { message: (error as Error).message };
          set({ error: apiError, isLoading: false });
          throw error;
        }
      },

      listCrawlJobs: async (params: PaginationParams = {}) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await listCrawlJobsApi(params);
          
          set({
            jobs: response.data,
            totalJobs: response.total,
            isLoading: false,
            currentPage: Math.floor((params.offset || 0) / (params.limit || 50)),
            pageSize: params.limit || 50,
          });

          return response.data;
        } catch (error) {
          const apiError: ApiError = { message: (error as Error).message };
          set({ error: apiError, isLoading: false });
          throw error;
        }
      },

      stopCrawlJob: async (id: number) => {
        set({ error: null });
        
        try {
          await stopCrawlJobApi(id);

          // Optimistically update the job status
          set(state => ({
            jobs: state.jobs.map(job => 
              job.id === id 
                ? { ...job, status: 'canceled' as const }
                : job
            ),
          }));
        } catch (error) {
          const apiError: ApiError = { message: (error as Error).message };
          set({ error: apiError });
          throw error;
        }
      },

      deleteCrawlJob: async (id: number) => {
        set({ error: null });
        
        try {
          await deleteCrawlJobApi(id);

          // Remove the job from the list
          set(state => ({
            jobs: state.jobs.filter(job => job.id !== id),
          }));
        } catch (error) {
          const apiError: ApiError = { message: (error as Error).message };
          set({ error: apiError });
          throw error;
        }
      },

      // Local State Management
      updateJob: (id: number, updates: Partial<CrawlJob>) => {
        set(state => ({
          jobs: state.jobs.map(job =>
            job.id === id ? { ...job, ...updates } : job
          ),
        }));
      },

      upsertJobFromSSE: (job: CrawlJob) => {
        set(state => {
          const existingIndex = state.jobs.findIndex(j => j.id === job.id);
          if (existingIndex >= 0) {
            // Update existing job
            const updatedJobs = [...state.jobs];
            updatedJobs[existingIndex] = job;
            return { jobs: updatedJobs };
          } else {
            // Add new job at the beginning
            return { jobs: [job, ...state.jobs] };
          }
        });
      },

      removeJob: (id: number) => {
        set(state => ({
          jobs: state.jobs.filter(job => job.id !== id),
        }));
      },

      clearError: () => {
        set({ error: null });
      },

      // SSE Management
      connectSSE: () => {
        const { abortController: currentController } = get();
        
        // Abort existing connection
        if (currentController) {
          sseManager.disconnect(currentController);
        }

        const onJobUpdate = (jobData: CrawlJob) => {
          const { upsertJobFromSSE } = get();
          upsertJobFromSSE(jobData);
        };

        const onConnectionChange = (connected: boolean) => {
          set({ sseConnected: connected });
          
          // Auto-reconnect logic for connection failures
          if (!connected) {
            const { abortController } = get();
            // Only attempt reconnection if we still have an active controller
            // and it wasn't manually disconnected
            if (abortController && !abortController.signal.aborted) {
              setTimeout(() => {
                console.log('🔄 Attempting SSE reconnection...');
                const { connectSSE } = get();
                connectSSE();
              }, 5000);
            }
          }
        };

        const controller = sseManager.connect(onJobUpdate, onConnectionChange);
        set({ abortController: controller });
      },

      disconnectSSE: () => {
        const { abortController } = get();
        if (abortController) {
          sseManager.disconnect(abortController);
          set({ 
            abortController: null, 
            sseConnected: false 
          });
        }
      },

      // Utility Actions
      refreshJobs: async () => {
        const { listCrawlJobs, currentPage, pageSize } = get();
        await listCrawlJobs({ 
          limit: pageSize, 
          offset: currentPage * pageSize 
        });
      },

      getJobById: (id: number) => {
        return get().jobs.find(job => job.id === id);
      },
    }),
    {
      name: 'crawl-store', // Name for Redux DevTools
    }
  )
);

// Enhanced selectors hook that combines store state with derived selectors
export const useCrawlStoreSelectors = (): CrawlStore & CrawlStoreSelectors => {
  const store = useCrawlStore();
  const selectors = createSelectors(store.jobs);
  
  return {
    ...store,
    ...selectors,
  };
};