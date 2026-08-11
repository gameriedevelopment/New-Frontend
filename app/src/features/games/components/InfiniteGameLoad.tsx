import { useEffect, useRef } from "react";

export function InfiniteGameLoad({
  fetching,
  hasMore,
  label,
  onLoad,
}: {
  fetching: boolean;
  hasMore: boolean;
  label: string;
  onLoad: () => void;
}) {
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = sentinel.current;
    if (!node || !hasMore) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !fetching) onLoad();
      },
      { rootMargin: "280px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [fetching, hasMore, onLoad]);
  if (!hasMore && !fetching) return null;
  return (
    <div className="game-load" ref={sentinel}>
      {fetching ? (
        <span>
          <i />
          Loading more
        </span>
      ) : (
        <button type="button" onClick={onLoad}>
          {label}
        </button>
      )}
    </div>
  );
}
