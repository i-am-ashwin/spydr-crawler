import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Dashboard from '@/app/dashboard/page';
import { useCrawlStore } from '@/lib/crawlStore/store';
import { 
  TEST_URL, 
  TEST_URL_INPUT_PLACEHOLDER,
  createMockJob,
  createMockFunctions,
  clearCommonMocks,
  mockMotion
} from '../lib/test-utils/mocks';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('react-hot-toast', () => ({
  error: jest.fn(),
}));

jest.mock('@/lib/crawlStore/store', () => ({
  useCrawlStore: jest.fn(),
}));

mockMotion();

describe('Dashboard Page', () => {
  const mocks = createMockFunctions();

  beforeEach(() => {
    clearCommonMocks(mocks);
    
    (useRouter as jest.Mock).mockReturnValue({
      push: mocks.mockPush,
    });

    (useCrawlStore as unknown as jest.Mock).mockReturnValue(mocks.mockCreateCrawlJob);
  });

  it('renders the dashboard with correct elements', () => {
    render(<Dashboard />);
    
    expect(screen.getByPlaceholderText(TEST_URL_INPUT_PLACEHOLDER)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /analyze/i })).toBeInTheDocument();
  });

  it('allows user to enter a URL', async () => {
    const user = userEvent.setup();
    render(<Dashboard />);
    const urlInput = screen.getByPlaceholderText(TEST_URL_INPUT_PLACEHOLDER);
    await user.type(urlInput, TEST_URL);
    expect(urlInput).toHaveValue(TEST_URL);
  });

  it('disables submit button when URL is empty', () => {
    render(<Dashboard />);
    const submitButton = screen.getByRole('button', { name: /analyze/i });
    expect(submitButton).toBeDisabled();
  });

  it('successfully submits form and navigates to result page', async () => {
    const user = userEvent.setup();
    const mockJob = createMockJob({
      id: 123,
      status: 'queued' as const,
    });
    mocks.mockCreateCrawlJob.mockResolvedValue(mockJob);
    render(<Dashboard />);
    const urlInput = screen.getByPlaceholderText(TEST_URL_INPUT_PLACEHOLDER);
    const submitButton = screen.getByRole('button', { name: /analyze/i });
    await user.type(urlInput, TEST_URL);
    await user.click(submitButton);
    expect(mocks.mockCreateCrawlJob).toHaveBeenCalledWith(TEST_URL);
    await waitFor(() => {
      expect(mocks.mockPush).toHaveBeenCalledWith('/result/123');
    });
  });

  it('shows error toast when API call fails', async () => {
    const user = userEvent.setup();
    mocks.mockCreateCrawlJob.mockRejectedValue(new Error('API Error'));
    render(<Dashboard />);
    
    const urlInput = screen.getByPlaceholderText(TEST_URL_INPUT_PLACEHOLDER);
    const submitButton = screen.getByRole('button', { name: /analyze/i });
    await user.type(urlInput, TEST_URL);
    await user.click(submitButton);
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to create. Please try again.');
    });
    expect(submitButton).toBeEnabled();
    expect(urlInput).toBeEnabled();
  });

  it('handles null response from API', async () => {
    const user = userEvent.setup();
    mocks.mockCreateCrawlJob.mockResolvedValue(null);
    render(<Dashboard />);
    const urlInput = screen.getByPlaceholderText(TEST_URL_INPUT_PLACEHOLDER);
    const submitButton = screen.getByRole('button', { name: /analyze/i });
    await user.type(urlInput, TEST_URL);
    await user.click(submitButton);
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to create. Please try again.');
    });
  });
});