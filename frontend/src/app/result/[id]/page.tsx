'use client';

import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLongLeftIcon, LinkIcon, TrashIcon, GlobeEuropeAfricaIcon, CalendarIcon, ArrowPathIcon, StopCircleIcon } from '@heroicons/react/24/solid'
import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import HeaderIcon from '@/components/result/header-icon';
import StatusText from '@/components/result/status-text';
import AnalysisListItem from '@/components/result/analysis-list';
import AuthenticatedImage from '@/components/authenticated-image';
import { useCrawlStore } from '@/lib/crawlStore/store';

export default function ResultPage() {
    const params = useParams();
    const router = useRouter();
    const id = parseInt(params.id as string);

    const { getCrawlJob, deleteCrawlJob, createCrawlJob, jobs } = useCrawlStore();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const result = jobs.find(job => job.id === id);
    useEffect(() => {
        const loadJob = async () => {
            try {
                setIsLoading(true);
                setErrorMessage('Please wait, loading analysis...');
                await getCrawlJob(id);
            } catch (err) {
                setError((err as Error).message);
            } finally {
                setIsLoading(false);
            }
        };

        loadJob();
    }, [id, getCrawlJob]);

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this analysis?')) return;

        try {
            await deleteCrawlJob(id);
            router.push('/results');
        } catch (err) {
            setError((err as Error).message);
        }
    };

    const handleRerun = async () => {
        if (!result?.url) return;

        try {
            await createCrawlJob(result.url);
            router.push('/results');
        } catch (err) {
            setError((err as Error).message);
        }
    };
    const handleStop = async () => {
        if (!result) return;
        try {
            await useCrawlStore.getState().stopCrawlJob(result.id);
            router.push('/results');
        } catch (err) {
            setError((err as Error).message);
        }
    };

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-black via-neutral-900 to-black">
                <div className="mx-auto max-w-4xl px-6 py-12">
                    <div className="rounded-lg border border-red-800 bg-red-900/30 p-6 backdrop-blur-sm">
                        <h2 className="text-xl font-semibold text-red-400 mb-2">Error</h2>
                        <p className="text-red-300">{error}</p>
                        <button
                            onClick={() => router.back()}
                            className="mt-4 inline-flex items-center gap-2 text-neutral-400 hover:text-white"
                        >
                            <ArrowLongLeftIcon className="h-4 w-4" />
                            Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (isLoading || !result) {
        return (
            <div >
                <div className="mx-auto max-w-4xl px-6 py-12">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="mt-4 text-gray-400">Loading analysis</p>
                    </div>
                </div>
            </div>
        );
    }

    const pieData = [
        {
            name: 'Internal Links',
            value: result.internalLinks || 0,
            color: '#60a5fa'
        },
        {
            name: 'External Links',
            value: result.externalLinks || 0,
            color: '#4ade80'
        }
    ];

    return (
        <div >
            <div className="mx-auto max-w-4xl px-6 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="mb-8">
                        <button
                            onClick={() => router.back()}
                            className="mb-4 inline-flex items-center gap-2 text-neutral-400 transition-colors hover:text-white cursor-pointer"
                        >
                            <ArrowLongLeftIcon className="h-4 w-4" />
                            Back
                        </button>

                        <div className="flex items-start gap-4">
                            <HeaderIcon status={result.status} />
                            <div>
                                <h1 className="mb-2 text-3xl font-bold">{result.title || 'Untitled'}</h1>
                                <div className="flex items-center gap-2 text-neutral-400">
                                    <LinkIcon className="h-4 w-4" />
                                    <a
                                        href={result.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="truncate hover:text-white transition-colors max-w-md"
                                    >
                                        {result.url}
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
            {result.errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm mb-4"
              >
                {result.errorMessage}
              </motion.div>
            )}
                    <div className="grid gap-6 md:grid-cols-2">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3, duration: 0.6 }}
                            className="space-y-6"
                        >
                            <AuthenticatedImage
                                src={result.screenshotPath
                                    ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/crawl/${result.id}/screenshot`
                                    : "/default-image.jpg"
                                }
                                alt="Website Screenshot"
                                width={600}
                                height={600}
                                className="w-full h-full object-cover rounded-lg border border-neutral-800 bg-neutral-900/30 backdrop-blur-sm"
                            />
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4, duration: 0.6 }}
                            className="space-y-6"
                        >
                            <div className="rounded-lg border border-neutral-800 bg-neutral-900/30 p-6 backdrop-blur-sm">
                                <h2 className="mb-4 text-xl font-semibold">Analysis Overview</h2>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-neutral-400">Status</span>
                                        <StatusText status={result.status} />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-neutral-400">Created</span>
                                        <div className="flex items-center gap-2">
                                            <CalendarIcon className="h-4 w-4 text-neutral-400" />
                                            <span>{new Date(result.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-neutral-400">HTML Version</span>
                                        <span>{result.htmlVersion}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="rounded-lg border border-neutral-800 bg-neutral-900/30 p-6 backdrop-blur-sm">
                                <h2 className="mb-6 text-lg font-medium text-neutral-200">Actions</h2>
                                <div className="space-y-2">
                      { (result.status === 'queued' || result.status == 'running' ) ?  (
                                    <button
                                        onClick={handleStop}
                                        className="flex w-full items-center justify-center gap-2 rounded-md border border-neutral-700 bg-transparent px-4 py-2.5 text-sm font-medium text-neutral-300 transition-all duration-200 hover:border-red-600 hover:bg-red-950/20 hover:text-red-400 active:scale-[0.98] cursor-pointer"
                                    >
                                        <StopCircleIcon className="h-4 w-4" />
                                        Stop
                                    </button>) : ( <button
                                        onClick={handleRerun}
                                        className="flex w-full items-center justify-center gap-2 rounded-md bg-white px-4 py-2.5 text-sm font-medium text-black transition-all duration-200 hover:bg-neutral-100 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                                    >
                                        <ArrowPathIcon className="h-4 w-4" />

                                        Run Again
                                    </button> )
                                    }

                                    <button
                                        onClick={handleDelete}
                                        className="flex w-full items-center justify-center gap-2 rounded-md border border-neutral-700 bg-transparent px-4 py-2.5 text-sm font-medium text-neutral-300 transition-all duration-200 hover:border-red-600 hover:bg-red-950/20 hover:text-red-400 active:scale-[0.98] cursor-pointer"
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                        Delete Analysis
                                    </button>
                                </div>

                                <div className="mt-6 pt-4 border-t border-neutral-800">
                                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                                        <GlobeEuropeAfricaIcon className="h-4 w-4" />
                                        <span>Analysis ID: {result.id}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {result.status === 'done' && <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.6 }}
                        className="mt-8"
                    >
                        <div className="rounded-lg border border-neutral-800 bg-neutral-900/30 p-6 backdrop-blur-sm">
                            <h2 className="mb-6 text-xl font-semibold">Analysis Results</h2>
                            <div className="grid gap-6 md:grid-cols-2">
                                <ul className="space-y-2">
                                    <AnalysisListItem type="h1" value={result.h1.toString()} />
                                    <AnalysisListItem type="h2" value={result.h2.toString()} />
                                    <AnalysisListItem type="h3" value={result.h3.toString()} />
                                    <AnalysisListItem type="h4" value={result.h4.toString()} />
                                    <AnalysisListItem type="h5" value={result.h5.toString()} />
                                    <AnalysisListItem type="h6" value={result.h6.toString()} />
                                    <AnalysisListItem type="internalLinks" value={result.internalLinks.toString()} />
                                    <AnalysisListItem type="externalLinks" value={result.externalLinks.toString()} />
                                    <AnalysisListItem type="inaccessibleLinks" value={result.inaccessibleLinks.toString()} />
                                    <AnalysisListItem type="hasLoginForm" value={result.hasLoginForm ? "Yes" : "No"} />
                                </ul>
                                <div>
                                    <ResponsiveContainer width="100%" height={500}>
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={120}
                                                paddingAngle={1}
                                                dataKey="value"
                                            >
                                                <Cell fill="#60a5fa" />
                                                <Cell fill="#4ade80" />
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'rgba(23, 23, 23, 0.8)',
                                                    border: '1px solid rgb(64, 64, 64)',
                                                    borderRadius: '8px',
                                                }}
                                                itemStyle={{ color: '#ffffff' }}
                                            />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </motion.div>}
                </motion.div>
            </div>
        </div>
    );
}