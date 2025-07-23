import { PlayIcon, LinkIcon, ClockIcon, CheckCircleIcon, XCircleIcon, GlobeEuropeAfricaIcon, CalendarIcon, ArrowPathIcon } from '@heroicons/react/24/solid'
import { motion } from 'motion/react';
type StatusType = 'queued' | 'error' | 'success' | 'running';

interface HeaderIconProps {
    status: any;
}

const statusConfig: any = {
    queued: {
        className: 'text-yellow-500',
        icon: <ClockIcon className="h-4 w-4 text-yellow-500" />,
    },
    running: {
        className: 'text-blue-500',
        icon: <ArrowPathIcon className="h-4 w-4 text-blue-500" />,
    },
    success: {
        className: 'text-green-500',
        icon: <CheckCircleIcon className="h-4 w-4 text-green-500" />,
    },
    error: {
        className: 'text-red-500',
        icon: <XCircleIcon className="h-4 w-4 text-red-500" />,
    },
};

export default function StatusText({ status }: HeaderIconProps) {
    const config = statusConfig[status] || statusConfig.queued;
    return (
        <div className="flex items-center gap-2">
            {config.icon}
            <span className={config.className}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        </div>
    );
}