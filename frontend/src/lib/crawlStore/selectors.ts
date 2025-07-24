import { CrawlJob } from './types';

export interface CrawlStoreSelectors {
  // Derived state
  queuedJobs: CrawlJob[];
  runningJobs: CrawlJob[];
  completedJobs: CrawlJob[];
  failedJobs: CrawlJob[];
  canceledJobs: CrawlJob[];
  
  // Statistics
  stats: {
    total: number;
    queued: number;
    running: number;
    completed: number;
    failed: number;
    canceled: number;
  };
}

export const createSelectors = (jobs: CrawlJob[]): CrawlStoreSelectors => ({
  // Derived state
  queuedJobs: jobs.filter(job => job.status === 'queued'),
  runningJobs: jobs.filter(job => job.status === 'running'),
  completedJobs: jobs.filter(job => job.status === 'done'),
  failedJobs: jobs.filter(job => job.status === 'error'),
  canceledJobs: jobs.filter(job => job.status === 'canceled'),
  
  // Statistics
  stats: {
    total: jobs.length,
    queued: jobs.filter(job => job.status === 'queued').length,
    running: jobs.filter(job => job.status === 'running').length,
    completed: jobs.filter(job => job.status === 'done').length,
    failed: jobs.filter(job => job.status === 'error').length,
    canceled: jobs.filter(job => job.status === 'canceled').length,
  },
});
