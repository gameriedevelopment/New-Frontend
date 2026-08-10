import { ChevronRight, MapPin, MessageCircle, Settings, UserMinus, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button, SafeImage } from "../../../components/ui";
import { useAuthStore } from "../../auth/authStore";
import { useCreateConversation } from "../../messages/hooks";
import { useTogglePlayerFollow } from "../hooks";
import type { PlayerProfile } from "../types";
import { NetworkDialog } from "./interactions/NetworkDialog";
import { getProfileCompletion } from "../profileCompletion";

export function ProfileHeader({ own, profile }: { own: boolean; profile: PlayerProfile }) {
  const currentUser = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const createConversation = useCreateConversation();
  const follow = useTogglePlayerFollow(currentUser?.id, profile.id, Boolean(profile.isFollowedByCurrentUser));
  const [network, setNetwork] = useState<"followers" | "following" | null>(null);
  const location = profile.personalInfo?.location || profile.region;
  const followers = Number(profile.followersCount ?? profile.followers?.length ?? 0);
  const following = profile.following?.length ?? 0;
  const completion = getProfileCompletion(profile);
  const nextRequirement = completion.missing[0];

  const message = async () => {
    if (!currentUser) return;
    const conversation = await createConversation.mutateAsync({ participantIds: [currentUser.id, profile.id], type: "user", name: profile.username, avatar: profile.profileImage });
    navigate(`/messages?conversation=${conversation.id}`);
  };

  return <>
    <section className="profile-hero">
      <div className="profile-hero__cover"><SafeImage src={profile.backgroundImage} fallback="/profile-cover-fallback.jpg" alt="" loading="eager" fetchPriority="high" /></div>
      <div className="profile-hero__identity">
        <SafeImage className="profile-hero__avatar" src={profile.profileImage} alt={`${profile.username}'s profile`} loading="eager" />
        <div className="profile-hero__name"><span>{profile.isOnline ? <><i />Online now</> : "Player profile"}</span><h1>{profile.username}</h1><p>{profile.gamerTitle || profile.bio || "Building a place in the Gamerie community."}</p>{location ? <small><MapPin size={13} />{location}</small> : null}</div>
        <div className="profile-hero__actions">{own ? <Button variant="quiet" onClick={() => navigate("/settings?section=profile")}><Settings size={16} />Edit profile</Button> : <><Button variant="quiet" disabled={createConversation.isPending} onClick={() => void message()}><MessageCircle size={16} />Message</Button><Button disabled={follow.isPending} onClick={() => follow.mutate()}>{profile.isFollowedByCurrentUser ? <UserMinus size={16} /> : <UserPlus size={16} />}{profile.isFollowedByCurrentUser ? "Following" : "Follow"}</Button></>}</div>
      </div>
      <div className="profile-hero__metrics"><button type="button" aria-label={`View ${followers.toLocaleString()} followers`} aria-haspopup="dialog" aria-expanded={network === "followers"} onClick={() => setNetwork("followers")}><span>Followers</span><strong>{followers.toLocaleString()}</strong><small>View list <ChevronRight size={12} /></small></button><button type="button" aria-label={`View ${following.toLocaleString()} following`} aria-haspopup="dialog" aria-expanded={network === "following"} onClick={() => setNetwork("following")}><span>Following</span><strong>{following.toLocaleString()}</strong><small>View list <ChevronRight size={12} /></small></button><div><span>Player level</span><strong>{profile.gameLevel || "Not set"}</strong></div><div><span>Platforms</span><strong>{profile.platforms?.length ? profile.platforms.length : "—"}</strong></div></div>
      {createConversation.isError || follow.isError ? <p className="profile-inline-error" role="alert">That action could not be completed. Please try again.</p> : null}
    </section>
    {own && completion.score < 100 && nextRequirement ? <aside className="profile-completion" aria-label={`Profile ${completion.score}% complete`}><span aria-hidden="true">{completion.score}%</span><div><strong>Your player identity is {completion.score}% complete</strong><p>Still needed: {nextRequirement.label}{completion.missing.length > 1 ? ` and ${completion.missing.length - 1} more` : ""}.</p><div role="progressbar" aria-label="Profile completion" aria-valuemin={0} aria-valuemax={100} aria-valuenow={completion.score}><i style={{ width: `${completion.score}%` }} /></div></div><button type="button" onClick={() => navigate(nextRequirement.route)}>{nextRequirement.action}</button></aside> : null}
    {network ? <NetworkDialog kind={network} profileId={profile.id} onClose={() => setNetwork(null)} /> : null}
  </>;
}
