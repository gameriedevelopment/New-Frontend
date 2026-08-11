import { Skeleton, SkeletonAvatar, SkeletonText } from "../../../components/ui";

export function FeedSkeleton({
  count = 3,
  label = "Loading posts",
}: {
  count?: number;
  label?: string;
}) {
  return (
    <div className="feed-skeleton" role="status" aria-label={label} aria-busy="true">
      {Array.from({ length: count }, (_, index) => (
        <article className="feed-skeleton__post" key={index}>
          <div className="feed-skeleton__author">
            <SkeletonAvatar size={38} />
            <span>
              <Skeleton width={126} height={10} />
              <Skeleton width={82} height={8} />
            </span>
          </div>
          <SkeletonText lines={index === 1 ? 4 : 3} />
          {index === 1 ? <Skeleton className="feed-skeleton__media" height={240} /> : null}
          <div className="feed-skeleton__actions">
            <Skeleton width={48} height={12} />
            <Skeleton width={48} height={12} />
            <Skeleton width={48} height={12} />
          </div>
        </article>
      ))}
    </div>
  );
}
