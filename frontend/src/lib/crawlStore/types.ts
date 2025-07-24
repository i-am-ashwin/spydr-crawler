export interface CrawlJob {
  id: number;
  url: string;
  title: string;
  htmlVersion: string;
  h1: number;
  h2: number;
  h3: number;
  h4: number;
  h5: number;
  h6: number;
  internalLinks: number;
  externalLinks: number;
  inaccessibleLinks: number;
  hasLoginForm: boolean;
  screenshotPath: string;
  status: CrawlJobStatus;
  errorMessage: string;
  createdAt: string;
  updatedAt: string;
}
export type CrawlJobStatus = 'queued' | 'running' | 'done' | 'error' | 'canceled';
export interface PaginationParams {
  limit?: number;
  offset?: number;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface ApiError {
  message: string;
  code?: number;
}

export interface CrawlStore {
  // State
  jobs: CrawlJob[];
  isLoading: boolean;
  error: ApiError | null;
  sseConnected: boolean;
  abortController: AbortController | null;
  totalJobs: number;
  currentPage: number;
  pageSize: number;
  searchTerm: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  
  // API Actions
  createCrawlJob: (url: string) => Promise<CrawlJob>;
  getCrawlJob: (id: number) => Promise<CrawlJob>;
  listCrawlJobs: (params?: PaginationParams) => Promise<CrawlJob[]>;
  stopCrawlJob: (id: number) => Promise<void>;
  deleteCrawlJob: (id: number) => Promise<void>;
  
  // SSE update actions
  upsertJobFromSSE: (job: CrawlJob) => void;
  
  // utility actions 
  clearError: () => void;
  setPage: (page: number) => Promise<void>;
  refreshCurrentPage: () => Promise<void>;
  setSearchTerm: (searchTerm: string) => Promise<void>;
  setSorting: (sortBy: string, sortOrder: 'asc' | 'desc') => Promise<void>;
  
  // SSE Connection actions
  connectSSE: () => void;
  disconnectSSE: () => void;
}
