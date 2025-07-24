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
import { ChevronUpIcon, ChevronDownIcon, LinkIcon, ClockIcon, TrashIcon, ArrowPathIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import { useCrawlStore } from '@/lib/crawlStore/store';
import { CrawlJob } from '@/lib/crawlStore/types';
import StatusText from '@/components/result/status-text';

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
    listCrawlJobs, 
    deleteCrawlJob, 
    createCrawlJob 
  } = useCrawlStore();
  
  const [sorting, setSorting] = useState<SortingState>([]);
  const [currentPageState, setCurrentPageState] = useState(currentPage);
  
  useEffect(() => {
    const loadJobs = async () => {
      try {
        await listCrawlJobs({
          limit: pageSize,
          offset: currentPageState * pageSize
        });
      } catch (err) {
        console.error('failed', err);
      }
    };

    loadJobs();
  }, [currentPageState, pageSize, listCrawlJobs]);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this report?')) return;
    
    try {
      await deleteCrawlJob(id);
    } catch (err) {
      console.error('failed', err);
    }
  };

  const handleRerun = async (url: string) => {
    try {
      await createCrawlJob(url);
    } catch (err) {
      console.error('failed', err);
    }
  };

  const handleNextPage = () => {
    const nextPage = currentPageState + 1;
    const maxPage = Math.ceil(totalJobs / pageSize) - 1;
    if (nextPage <= maxPage) {
      setCurrentPageState(nextPage);
    }
  };

  const handlePrevPage = () => {
    if (currentPageState > 0) {
      setCurrentPageState(currentPageState - 1);
    }
  };

  const totalPages = Math.ceil(totalJobs / pageSize);
  const hasNextPage = currentPageState < totalPages - 1;
  const hasPrevPage = currentPageState > 0;
  const columns = useMemo(
    () => [
      columnHelper.accessor('title', {
        header: 'Title',
        cell: (info) => (
          <div className="font-medium text-white truncate max-w-xs">
            {info.getValue() || 'Untitled'}
          </div>
        ),
      }),
      columnHelper.accessor('url', {
        header: 'URL',
        cell: (info) => (
          <div className="flex items-center gap-2 text-neutral-400 truncate max-w-xs">
            <LinkIcon className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{info.getValue()}</span>
          </div>
        ),
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => {
          const status = info.getValue();
          return (
            <StatusText status={status} />
          );
        },
      }),
      columnHelper.accessor('createdAt', {
        header: 'Created',
        cell: (info) => (
          <div className="flex items-center gap-2 text-neutral-300">
            <ClockIcon className="h-3 w-3" />
            <span>{new Date(info.getValue()).toLocaleString()}</span>
          </div>
        ),
      }),
      columnHelper.accessor('id', {
        header: 'Actions',
        cell: (info) => {
          const job = info.row.original;
          return (
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(info.getValue());
                }}
                className="flex items-center justify-center gap-1 rounded-full cursor-pointer border border-red-700 bg-transparent px-2 py-1 text-xs font-medium text-red-400 transition-colors hover:bg-red-800/20"
              >
                <TrashIcon className="h-3 w-3" />
                Delete
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRerun(job.url);
                }}
                className="flex items-center justify-center gap-1 rounded-full cursor-pointer border border-blue-700 bg-transparent px-2 py-1 text-xs font-medium text-blue-400 transition-colors hover:bg-blue-800/20"
              >
                <ArrowPathIcon className="h-3 w-3" />
                Re-run
              </button>
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
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
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
              {isLoading && <span className="ml-2 text-blue-400">(Loading...)</span>}
            </p>
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
                                  className={`flex items-center gap-2 ${
                                    header.column.getCanSort()
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
                                        className={`h-3 w-3 ${
                                          header.column.getIsSorted() === 'asc'
                                            ? 'text-white'
                                            : 'text-neutral-600'
                                        }`}
                                      />
                                      <ChevronDownIcon
                                        className={`h-3 w-3 -mt-1 ${
                                          header.column.getIsSorted() === 'desc'
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
                    Page {currentPageState + 1} of {totalPages} 
                    <span className="ml-2">
                      ({currentPageState * pageSize + 1}-{Math.min((currentPageState + 1) * pageSize, totalJobs)} of {totalJobs})
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