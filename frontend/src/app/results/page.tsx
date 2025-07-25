'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  getSortedRowModel,
  SortingState,
} from '@tanstack/react-table';
import { ChevronUpIcon, StopCircleIcon, ChevronDownIcon, LinkIcon, ClockIcon, TrashIcon, ArrowPathIcon, ChevronLeftIcon, ChevronRightIcon, CodeBracketIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { useCrawlStore } from '@/lib/crawlStore/store';
import { CrawlJob } from '@/lib/crawlStore/types';
import StatusText from '@/components/result/status-text';
import toast from 'react-hot-toast';

const columnHelper = createColumnHelper<CrawlJob>();

export default function Results() {
  const router = useRouter();
  const {
    jobs,
    isLoading,
    error,
    currentPage,
    pageSize,
    totalJobs,
    searchTerm,
    sortBy,
    sortOrder,
    setPage,
    deleteCrawlJob,
    createCrawlJob,
    stopCrawlJob,
    setSearchTerm,
    setSorting
  } = useCrawlStore();

  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);

  const tableSorting: SortingState = useMemo(() => {
    return sortBy ? [{ id: sortBy, desc: sortOrder === 'desc' }] : [];
  }, [sortBy, sortOrder]);

  const handleSortingChange = (updaterOrValue: SortingState | ((old: SortingState) => SortingState)) => {
    const newSorting = typeof updaterOrValue === 'function' ? updaterOrValue(tableSorting) : updaterOrValue;

    if (newSorting.length === 0) {
      setSorting('createdAt', 'desc');
    } else {
      const sort = newSorting[0];
      setSorting(sort.id, sort.desc ? 'desc' : 'asc');
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearchTerm !== searchTerm) {
        setSearchTerm(localSearchTerm);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearchTerm, searchTerm, setSearchTerm]);

  useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    const initialize = async () => {
        await setPage(0);
    };
    initialize();
  }, [setPage]);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this report?')) return;

    try {
      await deleteCrawlJob(id);
    } catch (err) {
      toast.error('Failed to delete. Please try again.');
    }
  };

  const handleRerun = async (url: string) => {
    try {
      await createCrawlJob(url);
      toast.success('Successfully created a new job.');
    } catch (err) {
      toast.error('Failed to rerun. Please try again.');
    }
  };
  const handleStop = async (id: number) => {
    try {
      await stopCrawlJob(id);
      toast.success('Successfully stopped the job.');
    } catch (err) {
      toast.error('Failed to stop. Please try again.');
    }
  };
  const handleNextPage = async () => {
    if (currentPage < Math.ceil(totalJobs / pageSize) - 1) {
      await setPage(currentPage + 1);
    }
  };

  const handlePrevPage = async () => {
    if (currentPage > 0) {
      await setPage(currentPage - 1);
    }
  };

  const totalPages = Math.ceil(totalJobs / pageSize);
  const hasNextPage = currentPage < totalPages - 1;
  const hasPrevPage = currentPage > 0;
  const columns = useMemo(
    () => [
      columnHelper.accessor('title', {
        id: 'title',
        header: 'Project',
        cell: (info) => {
          const job = info.row.original;
          return (
            <div className="space-y-1">
              <div className="font-medium text-white truncate max-w-xs">
                {info.getValue() || 'Untitled'}
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-400 truncate max-w-xs">
                <LinkIcon className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{job.url}</span>
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor('status', {
        id: 'status',
        header: 'Status',
        cell: (info) => {
          const status = info.getValue();
          return (
            <StatusText status={status} />
          );
        },
      }),
      columnHelper.accessor('updatedAt', {
        id: 'updatedAt',
        header: 'Updated',
        cell: (info) => (
          <div className="flex items-center gap-2 text-neutral-300 text-sm">
            <ClockIcon className="h-4 w-4" />
            <span>{new Date(info.getValue()).toLocaleString()}</span>
          </div>
        ),
      }),
      columnHelper.accessor('htmlVersion', {
        id: 'htmlVersion',
        header: 'HTML Version',
        cell: (info) => (
          <div className="flex items-center gap-2 text-neutral-300 text-sm">
            <CodeBracketIcon className="h-3 w-3" />
            <span className="font-mono text-xs bg-neutral-800 px-2 py-1 rounded">
              {info.getValue() || 'Unknown'}
            </span>
          </div>
        ),
      }),
      columnHelper.accessor('id', {
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        cell: (info) => {
          const job = info.row.original;
          return (
            <div className="flex items-center justify-end">
              <div className="flex items-center">
                {(job.status === 'queued' || job.status == 'running') ? (<button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStop(job.id);
                  }}
                  className="p-2 hover:bg-neutral-800 rounded text-neutral-400 hover:text-red-500 transition-colors"
                  title="Stop"
                >
                  <StopCircleIcon className="h-4 w-4" />
                </button>) : (<button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRerun(job.url);
                  }}
                  className="p-2 hover:bg-neutral-800 rounded text-neutral-400 hover:text-blue-500 transition-colors"
                  title="Re-run"
                >
                  <ArrowPathIcon className="h-4 w-4" />
                </button>)}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(info.getValue());
                  }}
                  className="p-2 hover:bg-neutral-800 rounded text-neutral-400 hover:text-red-400 transition-colors"
                  title="Delete"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        },
      }),
    ],
    [handleDelete, handleRerun]
  );

  const table = useReactTable({
    data: jobs,
    columns,
    state: {
      sorting: tableSorting,
    },
    onSortingChange: handleSortingChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualSorting: true,
  });

  const handleRowClick = (job: CrawlJob) => {
    router.push(`/result/${job.id}`);
  };

  if (error) {
    return (
      <div>
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="rounded-lg border border-red-800 bg-red-900/30 p-6 backdrop-blur-sm">
            <h2 className="text-xl font-semibold text-red-400 mb-2">Error</h2>
            <p className="text-red-300">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mx-auto max-w-7xl px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold">Analysis Results</h1>
            <p className="text-neutral-400">
              {totalJobs} {totalJobs === 1 ? 'result' : 'results'} found
              {searchTerm && <span className="ml-1">for "{searchTerm}"</span>}
              {isLoading && <span className="ml-2 text-blue-400">(Loading...)</span>}
            </p>
          </div>
          <div className='mb-4 flex items-center justify-between'>
            <label className="relative block w-full">
              <span className="absolute inset-y-0 left-0 flex items-center pl-2">
                <MagnifyingGlassIcon className="h-5 w-5 text-neutral-300" />
              </span>
              {localSearchTerm && (
                <button
                  onClick={() => {
                    setLocalSearchTerm('');
                    setSearchTerm('');
                  }}
                  className="absolute inset-y-0 right-0 flex items-center pr-2 text-neutral-400 hover:text-white"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              )}
              <span className="sr-only">Search</span>
              <input
                className={`block w-full py-2 pr-9 pl-9 rounded-lg border border-neutral-700 bg-neutral-800/50 text-white placeholder:text-neutral-500 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/20 ${isLoading ? 'opacity-50' : ''}`}
                placeholder="Search by title, URL, or HTML version..."
                type="text"
                name="search"
                value={localSearchTerm}
                onChange={(e) => setLocalSearchTerm(e.target.value)}
                disabled={isLoading}
              /></label>
          </div>
          {jobs.length === 0 && !isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="rounded-lg border border-neutral-800 bg-neutral-900/30 p-12 text-center backdrop-blur-sm"
            >
              <p className="text-lg text-neutral-400">
                No results yet. Go to the{' '}
                <button
                  onClick={() => router.push('/dashboard')}
                  className="text-white underline hover:no-underline"
                >
                  dashboard
                </button>{' '}
                to analyze your first link.
              </p>
            </motion.div>
          ) : (

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="space-y-4"
            >
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/30 backdrop-blur-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-neutral-800/50">
                      {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <th
                              key={header.id}
                              className="px-6 py-4 text-left text-sm font-medium text-neutral-300"
                            >
                              {header.isPlaceholder ? null : (
                                <div
                                  className={`flex items-center gap-2 ${header.column.getCanSort()
                                    ? 'cursor-pointer select-none hover:text-white'
                                    : ''
                                    }`}
                                  onClick={header.column.getToggleSortingHandler()}
                                >
                                  {flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                                  {header.column.getCanSort() && (
                                    <div className="flex flex-col">
                                      <ChevronUpIcon
                                        className={`h-3 w-3 ${header.column.getIsSorted() === 'asc'
                                          ? 'text-white'
                                          : 'text-neutral-600'
                                          }`}
                                      />
                                      <ChevronDownIcon
                                        className={`h-3 w-3 -mt-1 ${header.column.getIsSorted() === 'desc'
                                          ? 'text-white'
                                          : 'text-neutral-600'
                                          }`}
                                      />
                                    </div>
                                  )}
                                </div>
                              )}
                            </th>
                          ))}
                        </tr>
                      ))}
                    </thead>
                    <tbody>
                      {table.getRowModel().rows.map((row, index) => (
                        <motion.tr
                          key={row.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05, duration: 0.3 }}
                          onClick={() => handleRowClick(row.original)}
                          className="cursor-pointer border-b border-neutral-800 transition-colors hover:bg-neutral-800/30"
                        >
                          {row.getVisibleCells().map((cell) => (
                            <td key={cell.id} className="px-6 py-4">
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                          ))}
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {totalPages > 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900/30 px-6 py-4 backdrop-blur-sm"
                >
                  <div className="text-sm text-neutral-400">
                    Page {currentPage + 1} of {totalPages}
                    <span className="ml-2">
                      ({currentPage * pageSize + 1}-{Math.min((currentPage + 1) * pageSize, totalJobs)} of {totalJobs})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrevPage}
                      disabled={!hasPrevPage || isLoading}
                      className="flex items-center gap-2 rounded-full border border-neutral-700 bg-transparent px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeftIcon className="h-4 w-4" />
                      Previous
                    </button>

                    <button
                      onClick={handleNextPage}
                      disabled={!hasNextPage || isLoading}
                      className="flex items-center gap-2 rounded-full border border-neutral-700 bg-transparent px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                      <ChevronRightIcon className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}