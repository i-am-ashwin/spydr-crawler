import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, useParams } from 'next/navigation';
import ResultPage from '@/app/result/[id]/page';
import { useCrawlStore } from '@/lib/crawlStore/store';
import { 
  TEST_URL,
  TEST_TITLE,
  createMockJob,
  createMockFunctions,
  clearCommonMocks,
  mockMotion
} from  '../lib/test-utils/mocks';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}));

jest.mock('react-hot-toast', () => ({
  error: jest.fn(),
}));

jest.mock('@/lib/crawlStore/store', () => ({
  useCrawlStore: jest.fn(),
}));

mockMotion();

jest.mock('@/components/result/status-text', () => {
  return function StatusText({ status }: { status: string }) {
    return <span data-testid="status-text" data-status={status}>{status}</span>;
  };
});

jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
  PieChart: ({ children }: { children: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

jest.mock('@/components/result/header-icon', () => {
  return function HeaderIcon({ status }: { status: string }) {
    return <div data-testid="header-icon" data-status={status}>Header Icon</div>;
  };
});

jest.mock('@/components/result/analysis-list', () => {
  return function AnalysisListItem({ type, value }: { type: string; value: string }) {
    return <li data-testid={`analysis-${type}`}>{type}: {value}</li>;
  };
});

jest.mock('@/components/authenticated-image', () => {
  return function AuthenticatedImage({ src, alt, ...props }: { src: string; alt: string; [key: string]: unknown }) {
    return <div data-testid="authenticated-image" data-src={src} data-alt={alt} {...props}>Image: {alt}</div>;
  };
});

describe('Result Page', () => {
  const mocks = createMockFunctions();

  const mockCompletedJob = createMockJob({
    id: 123,
  });

  const mockRunningJob = createMockJob({
    id: 124,
    status: 'running' as const,
  });

  const mockErrorJob = createMockJob({
    id: 125,
    status: 'error' as const,
    errorMessage: 'Failed to crawl website',
  });

  beforeEach(() => {
    clearCommonMocks(mocks);
    
    (useRouter as jest.Mock).mockReturnValue({
      push: mocks.mockPush,
      back: mocks.mockBack,
    });

    (useParams as jest.Mock).mockReturnValue({
      id: '123',
    });

    (useCrawlStore as unknown as jest.Mock).mockReturnValue({
      getCrawlJob: mocks.mockGetCrawlJob,
      deleteCrawlJob: mocks.mockDeleteCrawlJob,
      createCrawlJob: mocks.mockCreateCrawlJob,
      stopCrawlJob: mocks.mockStopCrawlJob,
      jobs: [mockCompletedJob],
    });
  });
  it('renders completed job details correctly', async () => {
    mocks.mockGetCrawlJob.mockResolvedValue(mockCompletedJob);
    render(<ResultPage />);
    await waitFor(() => {
      expect(screen.getByText(TEST_TITLE)).toBeInTheDocument();
    });
    expect(screen.getByText(TEST_URL)).toBeInTheDocument();
    expect(screen.getByTestId('header-icon')).toHaveAttribute('data-status', 'done');
    expect(screen.getByTestId('status-text')).toHaveAttribute('data-status', 'done');
    expect(screen.getByText('Analysis Overview')).toBeInTheDocument();
    expect(screen.getByText('HTML5')).toBeInTheDocument();
    expect(screen.getByText('Run Again')).toBeInTheDocument();
    expect(screen.getByText('Delete Analysis')).toBeInTheDocument();
    expect(screen.getByText('Analysis Results')).toBeInTheDocument();
    expect(screen.getByTestId('analysis-h1')).toHaveTextContent('h1: 1');
    expect(screen.getByTestId('analysis-internalLinks')).toHaveTextContent('internalLinks: 15');
    expect(screen.getByTestId('analysis-hasLoginForm')).toHaveTextContent('hasLoginForm: Yes');
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
  });

  it('shows stop button for running jobs', async () => {
    (useParams as jest.Mock).mockReturnValue({ id: '124' });
    (useCrawlStore as unknown as jest.Mock).mockReturnValue({
      getCrawlJob: mocks.mockGetCrawlJob,
      deleteCrawlJob: mocks.mockDeleteCrawlJob,
      createCrawlJob: mocks.mockCreateCrawlJob,
      stopCrawlJob: mocks.mockStopCrawlJob,
      jobs: [mockRunningJob],
    });
    mocks.mockGetCrawlJob.mockResolvedValue(mockRunningJob);
    render(<ResultPage />);
    await waitFor(() => {
      expect(screen.getByText('Stop')).toBeInTheDocument();
    });
    expect(screen.queryByText('Run Again')).not.toBeInTheDocument();
    expect(screen.queryByText('Analysis Results')).not.toBeInTheDocument(); 
  });

  it('shows error message for failed jobs', async () => {
    (useParams as jest.Mock).mockReturnValue({ id: '125' });
    (useCrawlStore as unknown as jest.Mock).mockReturnValue({
      getCrawlJob: mocks.mockGetCrawlJob,
      deleteCrawlJob: mocks.mockDeleteCrawlJob,
      createCrawlJob: mocks.mockCreateCrawlJob,
      stopCrawlJob: mocks.mockStopCrawlJob,
      jobs: [mockErrorJob],
    });

    mocks.mockGetCrawlJob.mockResolvedValue(mockErrorJob);

    render(<ResultPage />);

    await waitFor(() => {
      expect(screen.getByText('Failed to crawl website')).toBeInTheDocument();
    });
  });

  it('handles back button click', async () => {
    mocks.mockGetCrawlJob.mockResolvedValue(mockCompletedJob);

    render(<ResultPage />);

    await waitFor(() => {
      expect(screen.getByText(TEST_TITLE)).toBeInTheDocument();
    });

    const backButton = screen.getByRole('button', { name: /back/i });
    await userEvent.click(backButton);

    expect(mocks.mockBack).toHaveBeenCalled();
  });

  it('handles delete action with confirmation', async () => {
    mocks.mockGetCrawlJob.mockResolvedValue(mockCompletedJob);
    mocks.mockDeleteCrawlJob.mockResolvedValue(undefined);
    const originalConfirm = window.confirm;
    window.confirm = jest.fn(() => true);
    render(<ResultPage />);
    await waitFor(() => {
      expect(screen.getByText(TEST_TITLE)).toBeInTheDocument();
    });

    const deleteButton = screen.getByText('Delete Analysis');
    await userEvent.click(deleteButton);
    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this analysis?');
    expect(mocks.mockDeleteCrawlJob).toHaveBeenCalledWith(123);
    await waitFor(() => {
      expect(mocks.mockPush).toHaveBeenCalledWith('/results');
    });
    window.confirm = originalConfirm;
  });

  it('handles rerun action', async () => {
    mocks.mockGetCrawlJob.mockResolvedValue(mockCompletedJob);
    mocks.mockCreateCrawlJob.mockResolvedValue({ id: 126, url: TEST_URL });
    render(<ResultPage />);
    await waitFor(() => {
      expect(screen.getByText(TEST_TITLE)).toBeInTheDocument();
    });
    const rerunButton = screen.getByText('Run Again');
    await userEvent.click(rerunButton);
    expect(mocks.mockCreateCrawlJob).toHaveBeenCalledWith(TEST_URL);
    await waitFor(() => {
      expect(mocks.mockPush).toHaveBeenCalledWith('/results');
    });
  });

  it('handles stop action for running job', async () => {
    (useParams as jest.Mock).mockReturnValue({ id: '124' });
    (useCrawlStore as unknown as jest.Mock).mockReturnValue({
      getCrawlJob: mocks.mockGetCrawlJob,
      deleteCrawlJob: mocks.mockDeleteCrawlJob,
      createCrawlJob: mocks.mockCreateCrawlJob,
      stopCrawlJob: mocks.mockStopCrawlJob,
      jobs: [mockRunningJob],
    });
    const mockGetState = jest.fn(() => ({
      stopCrawlJob: mocks.mockStopCrawlJob,
    }));
    (useCrawlStore as unknown as { getState: jest.Mock }).getState = mockGetState;
    mocks.mockGetCrawlJob.mockResolvedValue(mockRunningJob);
    mocks.mockStopCrawlJob.mockResolvedValue(undefined);
    render(<ResultPage />);
    await waitFor(() => {
      expect(screen.getByText('Stop')).toBeInTheDocument();
    });
    const stopButton = screen.getByText('Stop');
    await userEvent.click(stopButton);
    expect(mocks.mockStopCrawlJob).toHaveBeenCalledWith(124);
    await waitFor(() => {
      expect(mocks.mockPush).toHaveBeenCalledWith('/results');
    });
  });
});