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
      console.log('🔌 Connecting to SSE...');
      const abortController = new AbortController();

      onConnectionChange(true);

      fetchEventSource(`${API_BASE}/crawl/updates`, {
        signal: abortController.signal,
        
        async onopen(response) {
          if (response.ok && response.headers.get('content-type')?.includes('text/event-stream')) {
            console.log('✅ SSE connected');
            return; // Connection successful
          } else {
            console.error('❌ SSE connection failed:', response.status, response.statusText);
            throw new Error(`Failed to open SSE connection: ${response.status} ${response.statusText}`);
          }
        },

        onmessage(event) {
          try {
            if (event.event === 'crawl_job_update') {
              const jobData: CrawlJob = JSON.parse(event.data);
              console.log('📡 SSE job update received:', jobData);
              onJobUpdate(jobData);
            } else if (event.event === 'ping') {
              console.log('💓 SSE heartbeat received');
            }
          } catch (error) {
            console.error('❌ Error parsing SSE message:', error);
          }
        },

        onerror(error) {
          console.error('❌ SSE connection error:', error);
          onConnectionChange(false);
          
          // Don't automatically reconnect for aborted connections
          if (error instanceof DOMException && error.name === 'AbortError') {
            return;
          }
          
          // Attempt to reconnect after 5 seconds for other errors
          setTimeout(() => {
            console.log('🔄 Attempting SSE reconnection...');
            // Note: Reconnection logic should be handled by the store
          }, 5000);
        },

        onclose() {
          console.log('🔌 SSE connection closed');
          onConnectionChange(false);
        }
      }).catch((error) => {
        console.error('❌ fetchEventSource error:', error);
        onConnectionChange(false);
      });

      return abortController;
    },

    disconnect: (controller) => {
      if (controller) {
        console.log('🔌 Disconnecting SSE...');
        controller.abort();
      }
    }
  };
};
