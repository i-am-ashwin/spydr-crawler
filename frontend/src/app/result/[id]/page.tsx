'use client';

import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLongLeftIcon, LinkIcon, ClockIcon, CheckCircleIcon, XCircleIcon, GlobeEuropeAfricaIcon, CalendarIcon } from '@heroicons/react/24/solid'
import { useState } from 'react';
import Image from 'next/image';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import HeaderIcon from '@/app/components/result/header-icon';
import TextSkeletonLoader from '@/app/components/text-skelton-loader';
import StatusText from '@/app/components/result/status-text';
import AnalysisListItem from '@/app/components/result/analysis-list';

export default function ResultPage() {
    const params = useParams();
    const router = useRouter();
    const [isLoading] = useState(false);

    const [result] = useState(() => ({
        id: params.id,
        title: 'This is the website title',
        url: 'https://example.com',
        status: 'running',
        responseTime: 123,
        timestamp: new Date(),
        description: 'This is a sample description of the website.',
        links: {
            internal: [
                { text: 'Internal Link 1', url: 'https://example.com/internal1' },
                { text: 'Internal Link 2', url: 'https://example.com/internal2' }
            ],
            external: [
                { text: 'External Link 1', url: 'https://external.com/link1' },
                { text: 'External Link 2', url: 'https://external.com/link2' }
            ]
        }
    }));
    return (
        <div className="min-h-screen bg-gradient-to-br from-black via-neutral-900 to-black">
            <div className="mx-auto max-w-4xl px-6 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="mb-8">
                        <button
                            onClick={() => router.back()}
                            className="mb-4 inline-flex items-center gap-2 text-neutral-400 transition-colors hover:text-white"
                        >
                            <ArrowLongLeftIcon className="h-4 w-4" />
                            Back
                        </button>

                        <div className="flex items-start gap-4">
                            <HeaderIcon status={result.status} />
                            <div>
                                <TextSkeletonLoader isLoading={isLoading} className="h-10 w-64">
                                    <h1 className="mb-2 text-3xl font-bold">{result.title}</h1>
                                </TextSkeletonLoader>
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

                    <div className="grid gap-6 md:grid-cols-2">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3, duration: 0.6 }}
                            className="space-y-6"
                        >
                            <Image
                                src="/default-image.jpg"
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
                                        <span className="text-neutral-400">Analyzed</span>
                                        <div className="flex items-center gap-2">
                                            <TextSkeletonLoader isLoading={isLoading} className='h-6 w-32'>
                                                <CalendarIcon className="h-4 w-4 text-neutral-400" />
                                                <span>{result.timestamp.toLocaleDateString()}</span>
                                            </TextSkeletonLoader>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="rounded-lg border border-neutral-800 bg-neutral-900/30 p-6 backdrop-blur-sm">
                                <h2 className="mb-4 text-xl font-semibold">Actions</h2>
                                <div className="space-y-3">
                                    <a
                                        href={result.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex w-full items-center justify-center gap-2 rounded-full border border-neutral-700 bg-transparent px-4 py-3 font-medium text-white transition-colors hover:bg-neutral-800"
                                    >
                                        <GlobeEuropeAfricaIcon className="h-4 w-4" />
                                        Delete Analysis
                                    </a>

                                    <button
                                        onClick={() => router.push('/results')}
                                        className="flex w-full items-center justify-center gap-2 rounded-full bg-white px-4 py-3 font-medium text-black transition-colors hover:bg-neutral-100"
                                    >
                                        Re-run Analysis
                                    </button>
                                    <button
                                        onClick={() => router.push('/results')}
                                        className="flex w-full items-center justify-center gap-2 rounded-full bg-white px-4 py-3 font-medium text-black transition-colors hover:bg-neutral-100"
                                    >
                                        View html version
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.6 }}
                        className="mt-8"
                    >
                        <div className="rounded-lg border border-neutral-800 bg-neutral-900/30 p-6 backdrop-blur-sm">
                            <h2 className="mb-6 text-xl font-semibold">Link Analysis</h2>
                            <div className="grid gap-3 md:grid-cols-2">
                                <ul className="space-y-2">
                                    <AnalysisListItem type="h1" value="10" isLoading={isLoading} />
                                    <AnalysisListItem type="h2" value="5" isLoading={isLoading} />
                                    <AnalysisListItem type="h3" value="3" isLoading={isLoading} />
                                    <AnalysisListItem type="internalLinks" value="11" isLoading={isLoading} />
                                    <AnalysisListItem type="externalLinks" value="15" isLoading={isLoading} />
                                    <AnalysisListItem type="inaccessibleLinks" value="2" isLoading={isLoading} />
                                    <AnalysisListItem type="hasLoginForm" value="Yes" isLoading={isLoading} />
                                </ul>
                                <div>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={[
                                                    {
                                                        name: 'Internal Links',
                                                        value: 11,
                                                        color: '#60a5fa'
                                                    },
                                                    {
                                                        name: 'External Links',
                                                        value: 15,
                                                        color: '#4ade80'
                                                    }
                                                ]}
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
                                                    backgroundColor: 'color-mix(in oklab, var(--color-neutral-800) 30%, transparent)',
                                                    border: '1px solid lab(27.036% 0 0)',
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
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}