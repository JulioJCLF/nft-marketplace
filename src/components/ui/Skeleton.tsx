import React from 'react'
import { cn } from '@/lib/utils'

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  shimmer?: boolean
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  shimmer = true,
  ...props
}) => {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-md bg-surface-secondary/70 motion-reduce:animate-none',
        shimmer &&
          'after:absolute after:inset-0 after:-translate-x-full after:animate-shimmer after:bg-gradient-to-r after:from-transparent after:via-white/[0.07] after:to-transparent',
        className
      )}
      aria-hidden="true"
      {...props}
    />
  )
}

export const NFTSkeletonCard: React.FC = () => {
  return (
    <div className="flex flex-col rounded-lg border border-border bg-card p-4 overflow-hidden">
      {/* Square Image Container */}
      <Skeleton className="w-full aspect-square rounded-md mb-4" />
      {/* Creator row */}
      <div className="flex items-center gap-2 mb-3">
        <Skeleton className="w-6 h-6 rounded-full" />
        <Skeleton className="w-24 h-4 rounded" />
      </div>
      {/* Title */}
      <Skeleton className="w-3/4 h-5 rounded mb-3" />
      {/* Price row */}
      <div className="flex justify-between items-center pt-2 border-t border-border/40">
        <div className="space-y-1">
          <Skeleton className="w-12 h-3 rounded" />
          <Skeleton className="w-20 h-4 rounded" />
        </div>
        <Skeleton className="w-24 h-9 rounded-md" />
      </div>
    </div>
  )
}
