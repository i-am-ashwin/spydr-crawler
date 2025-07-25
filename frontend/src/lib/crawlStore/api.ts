import { CrawlJob, PaginationParams, PaginatedResponse } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('auth-token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const apiCall = async <T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...(options.headers as Record<string, string> || {}),
  };

  const response = await fetch(`${API_BASE}/api${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
};
export const createCrawlJobApi = async (url: string): Promise<CrawlJob> => {
  return apiCall<CrawlJob>('/crawl', {
    method: 'POST',
    body: JSON.stringify({ url }),
  });
};

export const getCrawlJobApi = async (id: number): Promise<CrawlJob> => {
  return apiCall<CrawlJob>(`/crawl/${id}`);
};

export const listCrawlJobsApi = async (params: PaginationParams = {}): Promise<PaginatedResponse<CrawlJob>> => {
  const queryParams = new URLSearchParams();
  if (params.limit) queryParams.set('limit', params.limit.toString());
  if (params.offset) queryParams.set('offset', params.offset.toString());
  if (params.status) queryParams.set('status', params.status);
  if (params.search) queryParams.set('search', params.search);
  if (params.sortBy) queryParams.set('sortBy', params.sortBy);
  if (params.sortOrder) queryParams.set('sortOrder', params.sortOrder);

  return apiCall<PaginatedResponse<CrawlJob>>(`/crawl/list?${queryParams}`);
};

export const stopCrawlJobApi = async (id: number): Promise<void> => {
  return apiCall(`/crawl/${id}/stop`, {
    method: 'POST',
  });
};

export const deleteCrawlJobApi = async (id: number): Promise<void> => {
  return apiCall(`/crawl/${id}`, {
    method: 'DELETE',
  });
};

export const bulkDeleteCrawlJobsApi = async (ids: number[]): Promise<{ success: number[], failed: number[] }> => {
  return apiCall<{ success: number[], failed: number[] }>('/crawl/bulk/delete', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  });
};

export const bulkCreateCrawlJobsApi = async (urls: string[]): Promise<{ success: CrawlJob[], failed: string[] }> => {
  return apiCall<{ success: CrawlJob[], failed: string[] }>('/crawl/bulk/create', {
    method: 'POST',
    body: JSON.stringify({ urls }),
  });
};

export const bulkStopCrawlJobsApi = async (ids: number[]): Promise<{ success: number[], failed: number[] }> => {
  return apiCall<{ success: number[], failed: number[] }>('/crawl/bulk/stop', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  });
};

export { API_BASE };
