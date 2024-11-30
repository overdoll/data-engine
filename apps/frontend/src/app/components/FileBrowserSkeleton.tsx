import { Skeleton } from "@/components/skeleton"

import { HeadingSkeleton } from "@/components/skeleton"

export default function FileBrowserSkeleton() {
  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-[1fr_0.85fr] gap-8 py-3 px-2 h-[calc(100vh-55px)]`}
    >
      <Skeleton className="w-[400px] h-20 m-auto" />
      <div className="grid grid-cols-1 gap-1 p-3 min-h-[calc(100vh-64px)] mx-auto">
        {Array.from({ length: 20 }).map((_, i) => (
          <HeadingSkeleton characters={100} key={i} />
        ))}
      </div>
    </div>
  )
}
