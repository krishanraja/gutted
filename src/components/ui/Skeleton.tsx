export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-white/5 animate-pulse rounded-xl ${className}`} />
}

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-black pb-24 md:pb-8 md:ml-60 lg:ml-64">
      <div className="px-6 pt-12 pb-6">
        <Skeleton className="h-8 w-8 rounded-full mb-6" />
        <Skeleton className="h-4 w-32 mb-2" />
        <Skeleton className="h-7 w-48" />
      </div>
      <div className="px-6 mb-6">
        <Skeleton className="h-28 w-full rounded-2xl" />
      </div>
      <div className="px-6 mb-6">
        <Skeleton className="h-4 w-24 mb-3" />
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
      </div>
      <div className="px-6 space-y-3">
        <Skeleton className="h-4 w-24 mb-3" />
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
      </div>
    </div>
  )
}

export function HistorySkeleton() {
  return (
    <div className="min-h-screen bg-black pb-24 md:pb-8 md:ml-60 lg:ml-64">
      <div className="px-6 pt-12 pb-6">
        <Skeleton className="h-7 w-32 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="px-6 mb-6">
        <Skeleton className="h-28 w-full rounded-2xl" />
      </div>
      <div className="px-6 space-y-6">
        {[1, 2, 3].map(i => (
          <div key={i}>
            <Skeleton className="h-3 w-36 mb-3" />
            <div className="space-y-2">
              <Skeleton className="h-20 rounded-xl" />
              <Skeleton className="h-20 rounded-xl" />
            </div>
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
        <Skeleton className="h-4 w-12 mb-4" />
        <Skeleton className="h-7 w-40 mb-2" />
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="px-6 mb-4">
        <Skeleton className="h-16 rounded-2xl" />
      </div>
      <div className="px-6 mb-4 flex gap-1.5">
        {[1, 2, 3, 4, 5, 6, 7].map(i => <Skeleton key={i} className="h-8 w-10 rounded-lg" />)}
      </div>
      <div className="px-6 space-y-3">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
      </div>
    </div>
  )
}
