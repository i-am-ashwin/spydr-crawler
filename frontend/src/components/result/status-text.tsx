import { PlayIcon, LinkIcon, ClockIcon, CheckCircleIcon, XCircleIcon, GlobeEuropeAfricaIcon, CalendarIcon, ArrowPathIcon } from '@heroicons/react/24/solid'
import { motion } from 'motion/react';
import { CrawlJobStatus } from '@/lib/crawlStore/types';

interface StatusTextProps {
    status: CrawlJobStatus;
}

const statusConfig: Record<CrawlJobStatus, { className: string; icon: React.ReactElement; text: string }> = {
    queued: {
        className: 'text-yellow-500',
        icon: <ClockIcon className="h-4 w-4 text-yellow-500" />,
        text: 'Queued'
    },
    running: {
        className: 'text-blue-500',
        icon: <ArrowPathIcon className="h-4 w-4 text-blue-500" />,
        text: 'Running'
    },
    done: {
        className: 'text-green-500',
        icon: <CheckCircleIcon className="h-4 w-4 text-green-500" />,
        text: 'Success'
    },
    error: {
        className: 'text-red-500',
        icon: <XCircleIcon className="h-4 w-4 text-red-500" />,
        text: 'Error'
    },
    canceled: {
        className: 'text-gray-500',
        icon: <XCircleIcon className="h-4 w-4 text-gray-500" />,
        text: 'Canceled'
    },
};

export default function StatusText({ status }: StatusTextProps) {
    const config = statusConfig[status] || statusConfig.queued;
    return (
        <div className={`flex items-center gap-2 ${config.className}`}>
            {config.icon}
            <span className="font-medium">{config.text}</span>
        </div>
    );
}