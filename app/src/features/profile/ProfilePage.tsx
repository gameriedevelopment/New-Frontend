import { AlertCircle, RefreshCw } from "lucide-react";
import { useParams, useSearchParams } from "react-router-dom";
import { Button, Skeleton, SkeletonAvatar, SkeletonText, StatePanel } from "../../components/ui";
import { useAuthStore } from "../auth/authStore";
import { ProfileContent } from "./components/ProfileContent";
import { ProfileHeader } from "./components/ProfileHeader";
import { usePlayerProfile } from "./hooks";
import type { ProfileTab } from "./types";
import "./profile.css";

const tabs: Array<{ id: ProfileTab; label: string }> = [{ id: "info", label: "Overview" }, { id: "career", label: "Career" }, { id: "games", label: "Games" }, { id: "matches", label: "Matches" }, { id: "posts", label: "Posts" }, { id: "achievements", label: "Achievements" }];

function ProfileSkeleton() { return <div className="profile-skeleton" aria-label="Loading player profile" role="status"><Skeleton height={238} /><div><SkeletonAvatar size={100} /><span><Skeleton width="28%" height={18} /><SkeletonText lines={2} /></span></div><Skeleton height={64} /><div className="profile-skeleton__cards"><Skeleton height={210} /><Skeleton height={210} /></div></div>; }

export function ProfilePage() {
  const { username } = useParams();
  const currentUser = useAuthStore((state) => state.user);
  const [params, setParams] = useSearchParams();
  const query = usePlayerProfile(username);
  const requested = params.get("tab") as ProfileTab | null;
  const tab = tabs.some((item) => item.id === requested) ? requested! : "info";
  if (query.isLoading) return <ProfileSkeleton />;
  if (query.isError || !query.data) return <StatePanel tone="error" icon={<AlertCircle size={20} />} title="Player profile unavailable" description="This profile may not exist, or Gamerie could not load it right now." action={<Button size="small" variant="quiet" onClick={() => query.refetch()}><RefreshCw size={14} />Try again</Button>} />;
  const own = currentUser?.id === query.data.id;
  const changeTab = (next: ProfileTab) => { const nextParams = new URLSearchParams(params); if (next === "info") nextParams.delete("tab"); else nextParams.set("tab", next); setParams(nextParams, { replace: true }); };
  return <main className="profile-page"><ProfileHeader own={own} profile={query.data} /><nav className="profile-tabs" aria-label="Profile sections">{tabs.map((item) => <button type="button" key={item.id} aria-current={tab === item.id ? "page" : undefined} onClick={() => changeTab(item.id)}>{item.label}</button>)}</nav><ProfileContent own={own} profile={query.data} tab={tab} /></main>;
}
