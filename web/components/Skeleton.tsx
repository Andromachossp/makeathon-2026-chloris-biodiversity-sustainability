"use client";

import { useI18n } from "@/lib/i18n";

/** Shimmer block. Size it with className so it matches the final layout. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`skeleton ${className}`} />;
}

/** Wrapper for a skeleton screen: aria-busy + visually hidden "Loading…". */
export function SkeletonScreen({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { t } = useI18n();
  return (
    <div aria-busy="true" role="status" className={className}>
      <span className="sr-only-label">{t.loading}</span>
      {children}
    </div>
  );
}

export function RowsSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <SkeletonScreen className="flex flex-col gap-3 p-4">
      <Skeleton className="h-11 w-full rounded-full" />
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-[14px] border border-line bg-surface p-3">
          <Skeleton className="h-8 w-16" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-7 w-20 rounded-full" />
        </div>
      ))}
    </SkeletonScreen>
  );
}

export function MapSkeleton() {
  return (
    <SkeletonScreen className="relative flex h-[calc(100dvh-8rem)] flex-col">
      <div className="grid flex-1 grid-cols-8 grid-rows-8 gap-px p-px opacity-60" aria-hidden="true">
        {Array.from({ length: 64 }, (_, i) => (
          <Skeleton key={i} className="rounded-none" />
        ))}
      </div>
      <div className="absolute left-3 top-3 flex gap-2">
        <Skeleton className="h-9 w-24 rounded-full" />
        <Skeleton className="h-9 w-20 rounded-full" />
        <Skeleton className="h-9 w-28 rounded-full" />
      </div>
      <div className="rounded-t-[14px] border-t border-line bg-surface p-4">
        <Skeleton className="mx-auto mb-4 h-1.5 w-12 rounded-full" />
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="mb-2 h-10 w-full" />
        ))}
      </div>
    </SkeletonScreen>
  );
}

export function SpeciesSkeleton() {
  return (
    <SkeletonScreen className="flex flex-col gap-4 p-4">
      <Skeleton className="h-16 w-full rounded-[14px]" />
      <Skeleton className="h-28 w-full rounded-[14px]" />
      <div className="rounded-[14px] bg-surface p-5">
        <Skeleton className="mb-4 aspect-[16/10] w-full rounded-[14px]" />
        <div className="flex items-start justify-between">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-16 w-16 rounded-full" />
        </div>
        <Skeleton className="mt-4 h-8 w-3/4" />
        <Skeleton className="mt-2 h-8 w-1/2" />
        <div className="mt-5 flex flex-col gap-2 rounded-[14px] border border-line p-4">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-3 w-full" />
          ))}
        </div>
        <div className="mt-5 flex flex-col gap-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-3 w-full" />
          ))}
        </div>
        <Skeleton className="mt-5 aspect-square w-full" />
      </div>
    </SkeletonScreen>
  );
}

export function ScanSkeleton() {
  return (
    <SkeletonScreen className="flex flex-col items-center gap-6 p-4">
      <Skeleton className="mt-6 h-64 w-64 rounded-full" />
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </SkeletonScreen>
  );
}

export function TextSkeleton() {
  return (
    <SkeletonScreen className="flex flex-col gap-4 p-4">
      <Skeleton className="h-9 w-2/3" />
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-11/12" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      ))}
    </SkeletonScreen>
  );
}
