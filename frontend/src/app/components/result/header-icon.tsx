import { PlayIcon, LinkIcon, ClockIcon, CheckCircleIcon, XCircleIcon, GlobeEuropeAfricaIcon, CalendarIcon, ArrowPathIcon } from '@heroicons/react/24/solid'
import { motion } from 'motion/react';
type StatusType = 'queued' | 'error' | 'success' | 'running';

interface HeaderIconProps {
    status: any;
}

const statusConfig: any = {
    queued: {
        className: 'bg-yellow-500/20',
        icon: <ClockIcon className="h-6 w-6 text-yellow-500" />,
    },
    running: {
        className: 'bg-blue-500/20',
        icon: <ArrowPathIcon className="h-6 w-6 text-blue-500" />,
    },
    success: {
        className: 'bg-green-500/20',
        icon: <CheckCircleIcon className="h-6 w-6 text-green-500" />,
    },
    error: {
        className: 'bg-red-500/20',
        icon: <XCircleIcon className="h-6 w-6 text-red-500" />,
    },
};

export default function HeaderIcon({ status }: HeaderIconProps) {
    const config =  statusConfig[status] || statusConfig.queued;
    return (
        <motion.div
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className={`flex h-12 w-12 items-center justify-center rounded-full ${config.className}`}
        >
            {config.icon}
        </motion.div>
    );
}