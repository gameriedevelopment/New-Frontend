import { AlertCircle, Users } from "lucide-react";
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { SafeImage, SkeletonAvatar, SkeletonText } from "../../../../components/ui";
import { usePlayerConnections } from "../../hooks";
import { ProfileDialog } from "./ProfileDialog";

export function NetworkDialog({ kind, onClose, profileId }: { kind: "followers" | "following"; onClose: () => void; profileId: string }) {
  const query = usePlayerConnections(profileId, kind);
  const load = useRef<HTMLDivElement>(null);
  const players = query.data?.pages.flatMap((page) => page.data) ?? [];
  const total = query.data?.pages[0]?.total ?? 0;
  useEffect(() => { const node = load.current; if (!node || !query.hasNextPage) return; const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting && !query.isFetchingNextPage) void query.fetchNextPage(); }, { rootMargin: "180px" }); observer.observe(node); return () => observer.disconnect(); }, [query.fetchNextPage, query.hasNextPage, query.isFetchingNextPage]);
  return <ProfileDialog title={`${kind === "followers" ? "Followers" : "Following"}${total ? ` · ${total.toLocaleString()}` : ""}`} onClose={onClose}><div className="network-dialog__list">
    {query.isLoading ? Array.from({ length: 6 }, (_, index) => <div className="network-row-skeleton" key={index}><SkeletonAvatar size={38} /><SkeletonText lines={2} /></div>) : null}
    {query.isError ? <div className="network-dialog__state"><AlertCircle size={19} /><strong>Network could not load</strong><button type="button" onClick={() => query.refetch()}>Try again</button></div> : null}
    {!query.isLoading && !query.isError && !players.length ? <div className="network-dialog__state"><Users size={19} /><strong>{kind === "followers" ? "No followers yet" : "Not following anyone yet"}</strong><p>This network will grow as new player connections are made.</p></div> : null}
    {players.map((player) => <Link className="network-row" key={player.id} to={`/profile/${player.username}`} onClick={onClose}><span><SafeImage src={player.profileImage} alt="" />{player.isOnline ? <i aria-label="Online" /> : null}</span><div><strong>{player.username}</strong><small>{player.gamerTitle || "Gamerie player"}</small></div></Link>)}
    <div className="network-dialog__load" ref={load}>{query.isFetchingNextPage ? "Loading more…" : query.hasNextPage ? <button type="button" onClick={() => query.fetchNextPage()}>Load more</button> : players.length ? "End of list" : null}</div>
  </div></ProfileDialog>;
}
