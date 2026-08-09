import { Briefcase, Gamepad2, Lock, MessageSquareText, Swords, Trophy } from "lucide-react";
import type { ReactNode } from "react";
import type { PlayerProfile, ProfileTab } from "../types";

function Empty({ icon, title, description }: { icon: ReactNode; title: string; description: string }) { return <div className="profile-empty"><span>{icon}</span><h2>{title}</h2><p>{description}</p></div>; }
function label(value: unknown) { return typeof value === "string" && value.trim() ? value : null; }

export function ProfileContent({ own, profile, tab }: { own: boolean; profile: PlayerProfile; tab: ProfileTab }) {
  if (!own && (profile.profileVisibility === "private" || profile.profileVisibility === "friends")) return <Empty icon={<Lock size={20} />} title={profile.profileVisibility === "private" ? "This profile is private" : "Visible to connections"} description={profile.profileVisibility === "private" ? "This player has chosen to keep their full identity private." : "Follow this player to see the details they share with their network."} />;

  const games = profile.gamesPlayed?.length ? profile.gamesPlayed : profile.games ?? [];
  if (tab === "games") return games.length ? <div className="profile-card-grid">{games.map((game, index) => <article className="profile-data-card" key={game.id || index}><span><Gamepad2 size={16} />{label(game.platform) || game.platforms?.join(" · ") || "Game"}</span><h2>{label(game.game?.name) || label(game.name) || "Connected game"}</h2><p>{label(game.gameUsername) || "No gamer tag shared"}</p><footer>{label(game.rankData?.rank) || label(game.rank) || label(game.skillLevel) || "Rank not set"}</footer></article>)}</div> : <Empty icon={<Gamepad2 size={20} />} title="No games connected yet" description={own ? "Connect the games that shape your player identity." : "This player has not shared any games yet."} />;
  if (tab === "career") {
    const items = [...(profile.teams ?? []).map((item) => ({ id: item.id, title: item.team?.name || item.name || "Team", detail: item.title || item.role || "Member" })), ...(profile.milestones ?? []).map((item) => ({ id: item.id, title: item.title || "Career milestone", detail: item.description || item.date || item.createdAt || "" }))];
    return items.length ? <div className="profile-timeline">{items.map((item, index) => <article key={item.id || index}><span><Briefcase size={15} /></span><div><h2>{item.title}</h2><p>{item.detail}</p></div></article>)}</div> : <Empty icon={<Briefcase size={20} />} title="Career story in progress" description={own ? "Teams and milestones will build your gaming career timeline." : "This player has not added career milestones yet."} />;
  }
  if (tab === "achievements") return profile.achievements?.length ? <div className="profile-card-grid">{profile.achievements.map((achievement, index) => <article className="profile-data-card" key={achievement.id || index}><span><Trophy size={16} />{achievement.category || "Achievement"}</span><h2>{achievement.title || "Achievement"}</h2><p>{achievement.description || "Earned on Gamerie"}</p><footer>{achievement.points ? `${achievement.points} points` : achievement.isCompleted ? "Completed" : "In progress"}</footer></article>)}</div> : <Empty icon={<Trophy size={20} />} title="No achievements yet" description="Achievements earned across Gamerie will be collected here." />;
  if (tab === "matches") return <Empty icon={<Swords size={20} />} title="Match history is quiet" description="Completed and scheduled matches will appear here as this player competes." />;
  if (tab === "posts") return <Empty icon={<MessageSquareText size={20} />} title="No profile posts to show" description="Posts shared to this player’s wall will appear here." />;

  const info = [
    ["Player title", profile.gamerTitle], ["Level", profile.gameLevel], ["Region", profile.region],
    ["Location", profile.personalInfo?.location], ["Profession", profile.personalInfo?.profession], ["Platforms", profile.platforms?.join(", ")],
  ].filter((item): item is [string, string] => Boolean(item[1]));
  return <div className="profile-overview">
    <section className="profile-overview__primary"><header><span aria-hidden="true">01</span><div><p>About</p><h2>Player information</h2></div></header>{profile.bio ? <p className="profile-overview__bio">{profile.bio}</p> : null}{info.length ? <dl>{info.map(([name, value]) => <div key={name}><dt>{name}</dt><dd>{value}</dd></div>)}</dl> : <p className="profile-muted">{own ? "Add a few details to make this profile easier to understand." : "This player has not shared more information yet."}</p>}</section>
    <section className="profile-overview__secondary"><header><span aria-hidden="true">02</span><div><p>Strengths</p><h2>Skills and needs</h2></div></header>{profile.skills?.length ? <div className="profile-chips">{profile.skills.map((skill, index) => <span key={skill.id || index}>{skill.name || "Skill"}{Number(skill.endorsementCount ?? skill.endorsements ?? 0) > 0 ? <small>{Number(skill.endorsementCount ?? skill.endorsements)} endorsements</small> : null}</span>)}</div> : <p className="profile-muted">No skills have been added yet.</p>}{profile.needs?.length ? <div className="profile-needs">{profile.needs.map((need, index) => <p key={need.id || index}><strong>{need.title || need.type || "Looking for"}</strong>{need.description}</p>)}</div> : null}</section>
  </div>;
}
