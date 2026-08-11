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
  const onLoadRef = useRef(onLoad);
  const requestPending = useRef(false);

  useEffect(() => {
    onLoadRef.current = onLoad;
  }, [onLoad]);

  useEffect(() => {
    if (!fetching) requestPending.current = false;
  }, [fetching]);

  useEffect(() => {
    const node = trigger.current;
    if (!node || !hasMore) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !fetching && !requestPending.current) {
          requestPending.current = true;
          onLoadRef.current();
        }
      },
      { rootMargin: "240px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [fetching, hasMore]);
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
