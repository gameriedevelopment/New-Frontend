import { Check, MapPin, MessageCircle, Settings, UserMinus, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button, SafeImage } from "../../../components/ui";
import { useAuthStore } from "../../auth/authStore";
import { useCreateConversation } from "../../messages/hooks";
import { useTogglePlayerFollow } from "../hooks";
import type { PlayerProfile } from "../types";

function profileCompletion(profile: PlayerProfile) {
  const checks = [profile.profileImage, profile.backgroundImage, profile.bio, profile.gamerTitle, profile.region, profile.platforms?.length, profile.gamesPlayed?.length || profile.games?.length, profile.skills?.length];
  return Math.round(checks.filter(Boolean).length / checks.length * 100);
}

export function ProfileHeader({ own, profile }: { own: boolean; profile: PlayerProfile }) {
  const currentUser = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const createConversation = useCreateConversation();
  const follow = useTogglePlayerFollow(currentUser?.id, profile.id, Boolean(profile.isFollowedByCurrentUser));
  const location = profile.personalInfo?.location || profile.region;
  const followers = Number(profile.followersCount ?? profile.followers?.length ?? 0);
  const following = profile.following?.length ?? 0;

  const message = async () => {
    if (!currentUser) return;
    const conversation = await createConversation.mutateAsync({ participantIds: [currentUser.id, profile.id], type: "user", name: profile.username, avatar: profile.profileImage });
    navigate(`/messages?conversation=${conversation.id}`);
  };

  return <>
    <section className="profile-hero">
      <div className="profile-hero__cover">{profile.backgroundImage ? <SafeImage src={profile.backgroundImage} fallback="/media-fallback.svg" alt="" /> : null}</div>
      <div className="profile-hero__identity">
        <SafeImage className="profile-hero__avatar" src={profile.profileImage} alt={`${profile.username}'s profile`} />
        <div className="profile-hero__name"><span>{profile.isOnline ? <><i />Online now</> : "Player profile"}</span><h1>{profile.username}</h1><p>{profile.gamerTitle || profile.bio || "Building a place in the Gamerie community."}</p>{location ? <small><MapPin size={13} />{location}</small> : null}</div>
        <div className="profile-hero__actions">{own ? <Button variant="quiet" onClick={() => navigate("/settings?section=profile")}><Settings size={16} />Edit profile</Button> : <><Button variant="quiet" disabled={createConversation.isPending} onClick={() => void message()}><MessageCircle size={16} />Message</Button><Button disabled={follow.isPending} onClick={() => follow.mutate()}>{profile.isFollowedByCurrentUser ? <UserMinus size={16} /> : <UserPlus size={16} />}{profile.isFollowedByCurrentUser ? "Following" : "Follow"}</Button></>}</div>
      </div>
      <dl className="profile-hero__metrics"><div><dt>Followers</dt><dd>{followers.toLocaleString()}</dd></div><div><dt>Following</dt><dd>{following.toLocaleString()}</dd></div><div><dt>Player level</dt><dd>{profile.gameLevel || "Not set"}</dd></div><div><dt>Platforms</dt><dd>{profile.platforms?.length ? profile.platforms.length : "—"}</dd></div></dl>
      {createConversation.isError || follow.isError ? <p className="profile-inline-error" role="alert">That action could not be completed. Please try again.</p> : null}
    </section>
    {own && profileCompletion(profile) < 100 ? <aside className="profile-completion"><span><Check size={15} /></span><div><strong>Your player identity is {profileCompletion(profile)}% complete</strong><p>Add the details that help players and teams understand who you are.</p></div><button type="button" onClick={() => navigate("/settings?section=profile")}>Continue profile</button></aside> : null}
  </>;
}
