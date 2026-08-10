import { Lock } from "lucide-react";
import type { ReactNode } from "react";
import type { PlayerProfile, ProfileTab } from "../types";
import { NeedsPanel } from "./interactions/NeedsPanel";
import { ReferralPanel } from "./interactions/ReferralPanel";
import { ProfileCareer } from "./ProfileCareer";
import {
  AchievementsPanel,
  GamesAndRankings,
  MatchHistory,
  ProfilePosts,
  SkillsPanel,
} from "./ProfileDataSections";

function Empty({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="profile-empty">
      <span>{icon}</span>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}
function label(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

export function ProfileContent({
  own,
  profile,
  tab,
}: {
  own: boolean;
  profile: PlayerProfile;
  tab: ProfileTab;
}) {
  if (
    !own &&
    (profile.profileVisibility === "private" ||
      profile.profileVisibility === "friends")
  )
    return (
      <Empty
        icon={<Lock size={20} />}
        title={
          profile.profileVisibility === "private"
            ? "This profile is private"
            : "Visible to connections"
        }
        description={
          profile.profileVisibility === "private"
            ? "This player has chosen to keep their full identity private."
            : "Follow this player to see the details they share with their network."
        }
      />
    );

  if (tab === "games") return <GamesAndRankings own={own} profile={profile} />;
  if (tab === "career") return <ProfileCareer own={own} profile={profile} />;
  if (tab === "achievements")
    return <AchievementsPanel own={own} profile={profile} />;
  if (tab === "matches") return <MatchHistory profile={profile} />;
  if (tab === "posts") return <ProfilePosts own={own} profile={profile} />;

  const info = [
    ["Player title", profile.gamerTitle],
    ["Level", profile.gameLevel],
    ["Region", profile.region],
    ["Location", profile.personalInfo?.location],
    ["Profession", profile.personalInfo?.profession],
    ["Platforms", profile.platforms?.join(", ")],
  ].filter((item): item is [string, string] => Boolean(item[1]));
  return (
    <div className="profile-overview">
      <section className="profile-overview__primary">
        <header>
          <span aria-hidden="true">01</span>
          <div>
            <p>About</p>
            <h2>Player information</h2>
          </div>
        </header>
        {profile.bio ? (
          <p className="profile-overview__bio">{profile.bio}</p>
        ) : null}
        {info.length ? (
          <dl>
            {info.map(([name, value]) => (
              <div key={name}>
                <dt>{name}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="profile-muted">
            {own
              ? "Add a few details to make this profile easier to understand."
              : "This player has not shared more information yet."}
          </p>
        )}
      </section>
      <SkillsPanel own={own} profile={profile} />
      <NeedsPanel own={own} profile={profile} />
      {own ? <ReferralPanel /> : null}
    </div>
  );
}
