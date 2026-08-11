import { useEffect, useRef } from "react";

export function InfiniteLoadTrigger({
  fetching,
  hasMore,
  label = "Load more",
  onLoad,
}: {
  fetching: boolean;
  hasMore: boolean;
  label?: string;
  onLoad: () => void;
}) {
  const trigger = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = trigger.current;
    if (!node || !hasMore) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !fetching) onLoad();
      },
      { rootMargin: "240px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [fetching, hasMore, onLoad]);
  if (!hasMore && !fetching) return null;
  return (
    <div className="discovery-load" ref={trigger}>
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
