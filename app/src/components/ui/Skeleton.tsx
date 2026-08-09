import type { ReactNode } from "react";

type SkeletonProps = {
  className?: string;
  height?: number | string;
  width?: number | string;
};

export function Skeleton({ className = "", height = 16, width = "100%" }: SkeletonProps) {
  return (
    <span
      className={`g-skeleton ${className}`.trim()}
      aria-hidden="true"
      style={{ display: "block", height, width }}
    />
  );
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <span className="g-skeleton-text" aria-hidden="true">
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton key={index} width={index === lines - 1 ? "68%" : "100%"} height={10} />
      ))}
    </span>
  );
}

export function SkeletonAvatar({ size = 42 }: { size?: number }) {
  return (
    <Skeleton
      className="g-skeleton-avatar"
      height={size}
      width={size}
    />
  );
}

export function SkeletonCard({ children }: { children?: ReactNode }) {
  return (
    <div className="g-skeleton-card" aria-hidden="true">
      {children ?? (
        <>
          <Skeleton height={96} />
          <SkeletonText lines={3} />
        </>
      )}
    </div>
  );
}
