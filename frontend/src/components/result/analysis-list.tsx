import {  LinkIcon, LinkSlashIcon } from "@heroicons/react/24/solid";
import {  LockClosedIcon } from "@heroicons/react/24/outline";

import { DocumentIcon } from "@heroicons/react/24/outline";
import { motion } from "motion/react";

const itemConfig: any = {
    h1: {
        title: 'H1 Tags',
        icon: <DocumentIcon className="h-4 w-4 text-blue-400 flex-shrink-0" />,
    },
        h2: {
        title: 'H2 Tags',
        icon: <DocumentIcon className="h-4 w-4 text-blue-400 flex-shrink-0" />,
    },
        h3: {
        title: 'H3 Tags',
        icon: <DocumentIcon className="h-4 w-4 text-blue-400 flex-shrink-0" />,
    },
        h4: {
        title: 'H4 Tags',
        icon: <DocumentIcon className="h-4 w-4 text-blue-400 flex-shrink-0" />,
    },
        h5: {
        title: 'H5 Tags',
        icon: <DocumentIcon className="h-4 w-4 text-blue-400 flex-shrink-0" />,
    },
        h6: {
        title: 'H6 Tags',
        icon: <DocumentIcon className="h-4 w-4 text-blue-400 flex-shrink-0" />,
    },
        internalLinks: {
        title: 'Internal Links',
        icon: <LinkIcon className="h-4 w-4 text-green-400 flex-shrink-0" />,
    },
        externalLinks: {
        title: 'External Links',
        icon: <LinkSlashIcon className="h-4 w-4 text-blue-400 flex-shrink-0" />,
    },
        inaccessibleLinks: {
        title: 'Inaccessible Links',
        icon: <LinkSlashIcon className="h-4 w-4 text-red-400 flex-shrink-0" />,
    },
        hasLoginForm: {
        title: 'Has Login Form',
        icon: <LockClosedIcon className="h-4 w-4 text-red-400 flex-shrink-0" />,
    },
};
export default function AnalysisListItem({ type, value }: {
    type: string;
    value: string;
}) {
    const config =  itemConfig[type];
    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 }}
            className="flex items-center gap-3 rounded-md border border-neutral-700 bg-neutral-800/30 p-3 hover:bg-neutral-800 transition-colors hover:border-neutral-600"
        >
            {config.icon}
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-neutral-300">
                    {config.title}
                </p>

            </div>
            <p className="truncate self-end text-xs text-white ">
                {value}
            </p>
        </motion.div>
    );
}