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
const sseManager = createSSEManager();

export const useCrawlStore = create<CrawlStore>()(
  devtools(
    (set, get) => ({
      jobs: [],
      isLoading: false,
      error: null,
      sseConnected: false,
      abortController: null,
      totalJobs: 0,
      currentPage: 0,
      pageSize: 10,
      searchTerm: '',
      sortBy: 'createdAt',
      sortOrder: 'desc' as const,

      createCrawlJob: async (url: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const job = await createCrawlJobApi(url);
          set(state => ({
            jobs: [job, ...state.jobs],
            totalJobs: state.totalJobs + 1,
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
        const existingJob = get().jobs.find(job => job.id === id);
        if (existingJob) {
          return existingJob;
        }
        set({ isLoading: true, error: null });
        
        try {
          const job = await getCrawlJobApi(id);
          set({ isLoading: false });
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
            currentPage: Math.floor((params.offset || 0) / (params.limit || 10)),
            pageSize: params.limit || 10,
            isLoading: false,
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
          set(state => ({
            jobs: state.jobs.filter(job => job.id !== id),
            totalJobs: Math.max(0, state.totalJobs - 1),
          }));
        } catch (error) {
          const apiError: ApiError = { message: (error as Error).message };
          set({ error: apiError });
          throw error;
        }
      },

      upsertJobFromSSE: (job: CrawlJob) => {
        set(state => {
          const existingIndex = state.jobs.findIndex(j => j.id === job.id);
          
          if (existingIndex >= 0) {
            const updatedJobs = [...state.jobs];
            updatedJobs[existingIndex] = job;
            return { jobs: updatedJobs };
          } else {
            return state;
          }
        });
      },

      clearError: () => {
        set({ error: null });
      },

      setPage: async (page: number) => {
        const { pageSize, searchTerm, sortBy, sortOrder, listCrawlJobs } = get();
        await listCrawlJobs({ 
          limit: pageSize, 
          offset: page * pageSize,
          search: searchTerm || undefined,
          sortBy,
          sortOrder
        });
      },

      refreshCurrentPage: async () => {
        const { currentPage, pageSize, searchTerm, sortBy, sortOrder, listCrawlJobs } = get();
        await listCrawlJobs({ 
          limit: pageSize, 
          offset: currentPage * pageSize,
          search: searchTerm || undefined,
          sortBy,
          sortOrder
        });
      },

      setSearchTerm: async (searchTerm: string) => {
        set({ searchTerm, currentPage: 0 });
        const { pageSize, sortBy, sortOrder, listCrawlJobs } = get();
        await listCrawlJobs({ 
          limit: pageSize, 
          offset: 0,
          search: searchTerm || undefined,
          sortBy,
          sortOrder
        });
      },

      setSorting: async (sortBy: string, sortOrder: 'asc' | 'desc') => {
        set({ sortBy, sortOrder, currentPage: 0 });
        const { pageSize, searchTerm, listCrawlJobs } = get();
        await listCrawlJobs({ 
          limit: pageSize, 
          offset: 0,
          search: searchTerm || undefined,
          sortBy,
          sortOrder
        });
      },

      connectSSE: () => {
        const { abortController: currentController } = get();
        if (currentController) {
          sseManager.disconnect(currentController);
        }

        const onJobUpdate = (jobData: CrawlJob) => {
          const { upsertJobFromSSE } = get();
          upsertJobFromSSE(jobData);
        };

        const onConnectionChange = (connected: boolean) => {
          set({ sseConnected: connected });
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
    }),
    {
      name: 'crawl-store', 
    }
  )
);

export const useCrawlStoreWithSelectors = (): CrawlStore & CrawlStoreSelectors => {
  const store = useCrawlStore();
  const selectors = createSelectors(store.jobs);
  
  return {
    ...store,
    ...selectors,
  };
};