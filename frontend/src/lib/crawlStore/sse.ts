import { fetchEventSource } from '@microsoft/fetch-event-source';
import { CrawlJob } from './types';
import { API_BASE } from './api';

export interface SSEManager {
  connect: (
    onJobUpdate: (job: CrawlJob) => void,
    onConnectionChange: (connected: boolean) => void
  ) => AbortController;
  disconnect: (controller: AbortController) => void;
}

export const createSSEManager = (): SSEManager => {
  return {
    connect: (onJobUpdate, onConnectionChange) => {
      const abortController = new AbortController();

      onConnectionChange(true);

      const token = localStorage.getItem('auth-token');
      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      fetchEventSource(`${API_BASE}/api/crawl/updates`, {
        signal: abortController.signal,
        headers,
        
        async onopen(response) {
          if (response.ok && response.headers.get('content-type')?.includes('text/event-stream')) {
            return;
          } else if (response.status === 401) {
            throw new Error(`SSE authentication failed: ${response.status} ${response.statusText}`);
          } else {
            throw new Error(`Failed to open SSE connection: ${response.status} ${response.statusText}`);
          }
        },

        onmessage(event) {
            if (event.event === 'crawl_job_update') {
              const jobData: CrawlJob = JSON.parse(event.data);
              onJobUpdate(jobData);
            }
        },

        onerror(error) {
          onConnectionChange(false);
          if (error instanceof DOMException && error.name === 'AbortError') {
            return;
          }
        },

        onclose() {
          onConnectionChange(false);
        }
      }).catch((error) => {
        onConnectionChange(false);
      });

      return abortController;
    },

    disconnect: (controller) => {
      if (controller) {
        controller.abort();
      }
    }
  };
};
