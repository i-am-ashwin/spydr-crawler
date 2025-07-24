import { ReactNode } from "react";

export default function TextSkeletonLoader({
    isLoading,
    className,
    children
}: {
    isLoading: boolean;
    className?: string;
    children: ReactNode;
}) {
    if (isLoading) {
        return (
            <div className={`animate-pulse rounded bg-neutral-800 animate-pulse ${className}`}>
            </div>
        );
    }
    return (
        <>
            {children}
        </>
    );
}
