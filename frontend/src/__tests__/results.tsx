import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import ResultsPage from '@/app/results/page';
import { useCrawlStore } from '@/lib/crawlStore/store';
import { 
  mockJobs,
  createMockFunctions,
  clearCommonMocks,
  mockMotion
} from  '../lib/test-utils/mocks';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/crawlStore/store', () => ({
  useCrawlStore: jest.fn(),
}));

mockMotion('framer-motion');

jest.mock('@/components/result/status-text', () => {
  return function StatusText({ status }: { status: string }) {
    return <span data-testid="status-text" data-status={status}>{status}</span>;
  };
});

jest.mock('@tanstack/react-table', () => ({
  useReactTable: jest.fn(),
  getCoreRowModel: jest.fn(),
  getSortedRowModel: jest.fn(),
  createColumnHelper: jest.fn(() => ({
    display: jest.fn((config) => config),
    accessor: jest.fn((accessor, config) => ({ ...config, accessor })),
  })),
  flexRender: jest.fn((component: unknown, context: unknown) => {
    if (typeof component === 'function') {
      return component(context);
    }
    return component;
  }),
}));

jest.mock('@/components/result/status-text', () => {
  return function StatusText({ status }: { status: string }) {
    return <span data-testid="status-text" data-status={status}>{status}</span>;
  };
});

describe('Results Page', () => {
  const mocks = createMockFunctions();

  const renderResultsPage = async () => {
    await act(async () => {
      render(<ResultsPage />);
    });
  };

  const mockTableInstance = {
    getHeaderGroups: () => [
      {
        id: 'header-group',
        headers: [
          {
            id: 'select',
            isPlaceholder: false,
            column: { 
              columnDef: { header: 'Select' }, 
              getCanSort: () => false,
              getToggleSortingHandler: () => jest.fn(),
            },
            getContext: () => ({}),
            colSpan: 1,
          },
          {
            id: 'title',
            isPlaceholder: false,
            column: { 
              columnDef: { header: 'Project' }, 
              getCanSort: () => true,
              getToggleSortingHandler: () => jest.fn(),
              getIsSorted: () => false,
            },
            getContext: () => ({}),
            colSpan: 1,
          },
        ],
      },
    ],
    getRowModel: () => ({
      rows: mockJobs.map((job) => ({
        id: job.id.toString(),
        original: job,
        getVisibleCells: () => [
          {
            id: `${job.id}-select`,
            column: { 
              columnDef: { 
                cell: () => <input type="checkbox" data-testid={`checkbox-${job.id}`} />
              } 
            },
            getContext: () => ({ row: { original: job } }),
          },
          {
            id: `${job.id}-title`,
            column: { 
              columnDef: { 
                cell: () => (
                  <div data-testid={`job-title-${job.id}`}>
                    {job.title}
                  </div>
                )
              } 
            },
            getContext: () => ({ 
              getValue: () => job.title,
              row: { original: job }
            }),
          },
        ],
        getIsSelected: () => false,
        getToggleSelectedHandler: () => jest.fn(),
      })),
    }),
    getSelectedRowModel: () => ({ rows: [] }),
    getIsAllRowsSelected: () => false,
    getToggleAllRowsSelectedHandler: () => jest.fn(),
  };

  const defaultStoreReturn = {
    jobs: mockJobs,
    isLoading: false,
    error: null,
    currentPage: 0,
    pageSize: 10,
    totalJobs: 2,
    searchTerm: '',
    sortBy: 'createdAt',
    sortOrder: 'desc' as const,
    setPage: mocks.mockSetPage,
    deleteCrawlJob: jest.fn(),
    createCrawlJob: jest.fn(),
    stopCrawlJob: jest.fn(),
    setSearchTerm: mocks.mockSetSearchTerm,
    setSorting: jest.fn(),
    bulkDeleteCrawlJobs: jest.fn(),
    bulkCreateCrawlJobs: jest.fn(),
    bulkStopCrawlJobs: jest.fn(),
  };

  beforeEach(() => {
    clearCommonMocks(mocks);
    
    (useRouter as jest.Mock).mockReturnValue({
      push: mocks.mockPush,
    });

    (useCrawlStore as unknown as jest.Mock).mockReturnValue(defaultStoreReturn);

    const mockUseReactTable = jest.requireMock('@tanstack/react-table').useReactTable;
    mockUseReactTable.mockReturnValue(mockTableInstance);
  });

  it('renders the results page with correct title and count', async () => {
    await renderResultsPage();
    
    expect(screen.getByText('Analysis Results')).toBeInTheDocument();
    expect(screen.getByText('2 results found')).toBeInTheDocument();
  });

  it('displays search input with correct placeholder', async () => {
    await renderResultsPage();
    
    const searchInput = screen.getByPlaceholderText('Search by title, URL, or HTML version...');
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).not.toBeDisabled();
  });

  it('handles search input changes with debouncing', async () => {
    const user = userEvent.setup();
    await renderResultsPage();
    
    const searchInput = screen.getByPlaceholderText('Search by title, URL, or HTML version...');
    
    await user.type(searchInput, 'example');
    expect(searchInput).toHaveValue('example');
    await waitFor(() => {
      expect(mocks.mockSetSearchTerm).toHaveBeenCalledWith('example');
    }, { timeout: 500 });
  });

  it('shows clear button and clears search when clicked', async () => {
    const user = userEvent.setup();
    (useCrawlStore as unknown as jest.Mock).mockReturnValue({
      ...defaultStoreReturn,
      searchTerm: 'test search',
    });

    await renderResultsPage();
    
    const searchInput = screen.getByPlaceholderText('Search by title, URL, or HTML version...');
    expect(searchInput).toHaveValue('test search');
    const clearButton = screen.getByRole('button');
    await user.click(clearButton);
    
    expect(mocks.mockSetSearchTerm).toHaveBeenCalledWith('');
  });

  it('shows empty state when no jobs exist', async () => {
    (useCrawlStore as unknown as jest.Mock).mockReturnValue({
      ...defaultStoreReturn,
      jobs: [],
      totalJobs: 0,
    });
    mockTableInstance.getRowModel = () => ({ rows: [] });
    
    await renderResultsPage();
    
    expect(screen.getByText('0 results found')).toBeInTheDocument();
    expect(screen.getByText(/No results yet/)).toBeInTheDocument();
    expect(screen.getByText('dashboard')).toBeInTheDocument();
  });

  it('navigates to dashboard when dashboard link is clicked in empty state', async () => {
    const user = userEvent.setup();
    (useCrawlStore as unknown as jest.Mock).mockReturnValue({
      ...defaultStoreReturn,
      jobs: [],
      totalJobs: 0,
    });
    mockTableInstance.getRowModel = () => ({ rows: [] });
    
    await renderResultsPage();
    
    const dashboardLink = screen.getByRole('button', { name: 'dashboard' });
    await user.click(dashboardLink);
    
    expect(mocks.mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('shows loading state correctly', async () => {
    (useCrawlStore as unknown as jest.Mock).mockReturnValue({
      ...defaultStoreReturn,
      isLoading: true,
    });

    await renderResultsPage();
    
    expect(screen.getByText('(Loading...)')).toBeInTheDocument();
    const searchInput = screen.getByPlaceholderText('Search by title, URL, or HTML version...');
    expect(searchInput).toBeDisabled();
  });

  it('displays error state', async () => {
    const mockError = { message: 'Failed to load results' };
    (useCrawlStore as unknown as jest.Mock).mockReturnValue({
      ...defaultStoreReturn,
      error: mockError,
    });

    await renderResultsPage();
    
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Failed to load results')).toBeInTheDocument();
  });

  it('renders table structure with basic table elements', async () => {
    await renderResultsPage();
    
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Select')).toBeInTheDocument();
    expect(screen.getByText('Project')).toBeInTheDocument();
  });

  it('verifies table renders with jobs', async () => {
    await renderResultsPage();
    
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(mockTableInstance.getHeaderGroups()).toHaveLength(1);
  });


});