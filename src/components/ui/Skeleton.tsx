'use client'
import {
  ShimmerBlock,
  CardSkeleton,
  ListSkeleton,
  ScoreSkeleton,
  StatGridSkeleton,
} from '@/components/motion/ContentSkeleton'

export function Skeleton({ className = '' }: { className?: string }) {
  return <ShimmerBlock className={`bg-white/5 ${className}`} rounded="xl" />
}

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-black pb-24 md:pb-8 md:ml-60 lg:ml-64">
      <div className="px-6 pt-12 pb-6">
        <ShimmerBlock className="h-8 w-8 mb-6" rounded="full" />
        <ShimmerBlock className="h-4 w-32 mb-2" rounded="sm" />
        <ShimmerBlock className="h-7 w-48" rounded="sm" />
      </div>
      <div className="px-6 mb-6 flex justify-center">
        <ScoreSkeleton size="lg" />
      </div>
      <div className="px-6 mb-6">
        <ShimmerBlock className="h-4 w-24 mb-3" rounded="sm" />
        <StatGridSkeleton count={3} />
      </div>
      <div className="px-6 space-y-3">
        <ShimmerBlock className="h-4 w-24 mb-3" rounded="sm" />
        <ListSkeleton count={3} />
      </div>
    </div>
  )
}

export function HistorySkeleton() {
  return (
    <div className="min-h-screen bg-black pb-24 md:pb-8 md:ml-60 lg:ml-64">
      <div className="px-6 pt-12 pb-6">
        <ShimmerBlock className="h-7 w-32 mb-2" rounded="sm" />
        <ShimmerBlock className="h-4 w-48" rounded="sm" />
      </div>
      <div className="px-6 mb-6 flex justify-center">
        <ScoreSkeleton size="lg" />
      </div>
      <div className="px-6 space-y-6">
        {[1, 2, 3].map(i => (
          <div key={i}>
            <ShimmerBlock className="h-3 w-36 mb-3" rounded="sm" />
            <ListSkeleton count={2} />
          </div>
        ))}
      </div>
    </div>
  )
}

export function MealPlanSkeleton() {
  return (
    <div className="min-h-screen bg-black pb-24 md:pb-8 md:ml-60 lg:ml-64">
      <div className="px-6 pt-12 pb-4">
        <ShimmerBlock className="h-4 w-12 mb-4" rounded="sm" />
        <ShimmerBlock className="h-7 w-40 mb-2" rounded="sm" />
        <ShimmerBlock className="h-4 w-56" rounded="sm" />
      </div>
      <div className="px-6 mb-4">
        <ShimmerBlock className="h-16 w-full" rounded="2xl" />
      </div>
      <div className="px-6 mb-4 flex gap-1.5">
        {[0, 1, 2, 3, 4, 5, 6].map(i => (
          <ShimmerBlock key={i} className="h-8 w-10" rounded="lg" delayIndex={Math.min(i, 4)} />
        ))}
      </div>
      <div className="px-6 space-y-3">
        <CardSkeleton lines={3} />
        <CardSkeleton lines={3} />
        <CardSkeleton lines={3} />
      </div>
    </div>
  )
}
