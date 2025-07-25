/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
import React from 'react';
import { CrawlJob } from '@/lib/crawlStore/types';

export const TEST_URL = 'https://example.com';
export const TEST_TITLE = 'Example Website';
export const TEST_URL_INPUT_PLACEHOLDER = 'https://example.com';

export const createMockJob = (overrides: Partial<CrawlJob> = {}): CrawlJob => ({
  id: 1,
  url: TEST_URL,
  title: TEST_TITLE,
  htmlVersion: 'HTML5',
  h1: 1,
  h2: 3,
  h3: 5,
  h4: 2,
  h5: 0,
  h6: 0,
  internalLinks: 15,
  externalLinks: 8,
  inaccessibleLinks: 2,
  hasLoginForm: true,
  screenshotPath: '/screenshots/example.png',
  status: 'done' as const,
  errorMessage: '',
  createdAt: '2025-09-01T10:00:00Z',
  updatedAt: '2025-09-01T10:05:00Z',
  ...overrides,
});

export const mockJobs: CrawlJob[] = [
  createMockJob({ id: 1 }),
  createMockJob({
    id: 2,
    url: 'https://test.com',
    title: 'Test Site',
    status: 'running' as const,
    createdAt: '2025-09-02T10:00:00Z',
    updatedAt: '2025-09-02T10:05:00Z',
  }),
];

export const setupCommonMocks = () => {
  // Navigation mocks
  jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
    useParams: jest.fn(),
  }));

  jest.mock('@/lib/crawlStore/store', () => ({
    useCrawlStore: jest.fn(),
  }));

  jest.mock('react-hot-toast', () => ({
    error: jest.fn(),
    success: jest.fn(),
  }));

  jest.mock('@/components/result/status-text', () => {
    return function StatusText({ status }: { status: string }) {
      return <span data-testid="status-text" data-status={status}>{status}</span>;
    };
  });
};

export const mockMotion = (library: 'motion/react' | 'framer-motion' = 'motion/react') => {
  jest.mock(library, () => ({
    motion: {
      div: ({ children, ...props }: any) => {
        const { initial, animate, transition, whileHover, whileTap, ...htmlProps } = props;
        return <div {...htmlProps}>{children}</div>;
      },
      form: ({ children, ...props }: any) => {
        const { initial, animate, transition, ...htmlProps } = props;
        return <form {...htmlProps}>{children}</form>;
      },
      button: ({ children, ...props }: any) => {
        const { whileHover, whileTap, ...htmlProps } = props;
        return <button {...htmlProps}>{children}</button>;
      },
      tr: ({ children, ...props }: any) => {
        const { initial, animate, transition, ...htmlProps } = props;
        return <tr {...htmlProps}>{children}</tr>;
      },
    },
  }));
};

export const createMockFunctions = () => ({
  mockPush: jest.fn(),
  mockBack: jest.fn(),
  mockSetPage: jest.fn().mockResolvedValue(undefined),
  mockSetSearchTerm: jest.fn(),
  mockGetCrawlJob: jest.fn(),
  mockDeleteCrawlJob: jest.fn(),
  mockCreateCrawlJob: jest.fn(),
  mockStopCrawlJob: jest.fn(),
});

export const clearCommonMocks = (mocks: ReturnType<typeof createMockFunctions>) => {
  Object.values(mocks).forEach(mock => mock.mockClear());
};
