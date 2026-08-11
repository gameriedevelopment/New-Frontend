import {
  ArrowUpRight,
  Briefcase,
  CalendarDays,
  Edit3,
  Plus,
  Trash2,
  Trophy,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button, SafeImage, SkeletonText, StatePanel } from "../../../components/ui";
import { getApiErrorMessage } from "../../../lib/errors";
import { useProfileTeams, useUpdatePlayerProfile } from "../hooks";
import type { PlayerProfile, ProfileTeam, ProfileTournament } from "../types";
import { MilestonesPanel } from "./interactions/MilestonesPanel";
import { ProfileDialog } from "./interactions/ProfileDialog";
import { SalaryInsights } from "./ProfileDataSections";

type TournamentDraft = {
  name: string;
  game: string;
  date: string;
  status: "upcoming" | "completed";
  placement: string;
  totalParticipants: string;
  prizePool: string;
  organizer: string;
  url: string;
};

const emptyTournament = (): TournamentDraft => ({
  name: "",
  game: "",
  date: new Date().toISOString().slice(0, 10),
  status: "upcoming",
  placement: "",
  totalParticipants: "",
  prizePool: "",
  organizer: "",
  url: "",
});

const tournamentName = (item: ProfileTournament) =>
  item.name || item.tournament?.name || item.title || "Tournament";
const tournamentGame = (item: ProfileTournament) =>
  typeof item.game === "string"
    ? item.game
    : item.game?.name || item.tournament?.game || "Game not shared";
const tournamentDate = (item: ProfileTournament) => {
  const date = new Date(item.date || "");
  return Number.isNaN(date.getTime()) ? null : date;
};
const teamName = (team: ProfileTeam) => team.name || team.team?.name || "Gamerie team";
const teamSlug = (team: ProfileTeam) =>
  team.slug ||
  team.team?.slug ||
  teamName(team)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

function TeamsPanel({
  profile,
  query,
}: {
  profile: PlayerProfile;
  query: ReturnType<typeof useProfileTeams>;
}) {
  const teams = query.data ?? [];
  const [expanded, setExpanded] = useState(false);
  const visibleTeams = expanded ? teams : teams.slice(0, 4);

  return (
    <section className="profile-team-history">
      <header>
        <div>
          <p>Competitive identity</p>
          <h2>Teams and roles</h2>
        </div>
        {!query.isLoading && !query.isError ? (
          <span>
            {teams.length} {teams.length === 1 ? "team" : "teams"}
          </span>
        ) : null}
      </header>
      {query.isLoading ? (
        <SkeletonText lines={5} />
      ) : query.isError ? (
        <StatePanel
          tone="error"
          title="Team history could not load"
          description={getApiErrorMessage(
            query.error,
            "Gamerie could not retrieve this player’s teams.",
          )}
          action={
            <Button size="small" variant="secondary" onClick={() => query.refetch()}>
              Retry
            </Button>
          }
        />
      ) : teams.length ? (
        <>
          <div className="profile-career-teams">
            {visibleTeams.map((team, index) => {
              const membership = team.members?.find(
                (member) => member.user?.id === profile.id || member.userId === profile.id,
              );
              return (
                <Link key={team.id || index} to={`/teams/${encodeURIComponent(teamSlug(team))}`}>
                  <SafeImage
                    src={team.logo || team.team?.logo}
                    fallback="/avatar-fallback.svg"
                    alt=""
                  />
                  <span>
                    <strong>{teamName(team)}</strong>
                    <small>
                      {membership?.title || membership?.role || team.title || team.role || "Member"}
                    </small>
                  </span>
                  <span className="profile-career-team__meta">
                    <small>
                      <Users size={12} />
                      {team.members?.length ?? 0}
                    </small>
                    <small>
                      <Trophy size={12} />
                      {team.stats?.tournamentWins ?? 0}
                    </small>
                  </span>
                  <ArrowUpRight size={15} aria-hidden="true" />
                </Link>
              );
            })}
          </div>
          {teams.length > 4 ? (
            <button
              type="button"
              className="profile-collection-more"
              aria-expanded={expanded}
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? "Show fewer teams" : `View all ${teams.length} teams`}
            </button>
          ) : null}
        </>
      ) : (
        <div className="profile-panel-empty">
          <p>{profile.username} is not currently listed on a team.</p>
          <Link to="/teams">
            Browse teams <ArrowUpRight size={13} />
          </Link>
        </div>
      )}
    </section>
  );
}

function TournamentsPanel({ own, profile }: { own: boolean; profile: PlayerProfile }) {
  const update = useUpdatePlayerProfile(profile.id);
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [confirming, setConfirming] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState<TournamentDraft>(emptyTournament);
  const tournaments = profile.tournaments ?? [];
  const sorted = useMemo(
    () =>
      tournaments
        .map((item, index) => ({ item, index }))
        .sort(
          (a, b) =>
            (tournamentDate(b.item)?.getTime() ?? 0) - (tournamentDate(a.item)?.getTime() ?? 0),
        ),
    [tournaments],
  );
  const gameOptions = Array.from(
    new Set(
      (profile.gamesPlayed ?? profile.games ?? [])
        .map((game) => game.game?.name || game.name)
        .filter((name): name is string => Boolean(name)),
    ),
  );
  const visibleTournaments = expanded ? sorted : sorted.slice(0, 4);

  const begin = (value: number | "new") => {
    setConfirming(null);
    setEditing(value);
    if (value === "new") return setDraft(emptyTournament());
    const item = tournaments[value];
    setDraft({
      name: tournamentName(item),
      game: tournamentGame(item) === "Game not shared" ? "" : tournamentGame(item),
      date: item.date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
      status:
        item.status ||
        ((tournamentDate(item)?.getTime() ?? 0) > Date.now() ? "upcoming" : "completed"),
      placement: item.placement == null ? "" : String(item.placement),
      totalParticipants: item.totalParticipants == null ? "" : String(item.totalParticipants),
      prizePool: item.prizePool == null ? "" : String(item.prizePool),
      organizer: item.organizer || item.tournament?.organizer || "",
      url: item.url || "",
    });
  };
  const normalized = tournaments.map((item) => ({
    id: item.id,
    name: tournamentName(item),
    game: tournamentGame(item) === "Game not shared" ? "Other" : tournamentGame(item),
    date: item.date || new Date().toISOString().slice(0, 10),
    status: item.status || "completed",
    placement: item.placement ?? undefined,
    totalParticipants: item.totalParticipants || 1,
    prizePool: item.prizePool == null ? undefined : String(item.prizePool),
    organizer: item.organizer || item.tournament?.organizer || "Not shared",
    url: item.url || undefined,
  }));
  const save = async () => {
    if (!draft.name.trim() || !draft.game.trim() || !draft.date || !draft.organizer.trim()) return;
    const next = {
      ...(typeof editing === "number" ? normalized[editing] : {}),
      id: typeof editing === "number" ? normalized[editing].id : undefined,
      name: draft.name.trim(),
      game: draft.game.trim(),
      date: draft.date,
      status: draft.status,
      placement: draft.placement ? Number(draft.placement) : undefined,
      totalParticipants: draft.totalParticipants ? Number(draft.totalParticipants) : 1,
      prizePool: draft.prizePool.trim() || undefined,
      organizer: draft.organizer.trim(),
      url: draft.url.trim() || undefined,
    };
    const items = [...normalized];
    typeof editing === "number" ? items.splice(editing, 1, next) : items.push(next);
    await update.mutateAsync({ tournaments: items });
    setEditing(null);
  };
  const remove = async (index: number) => {
    await update.mutateAsync({
      tournaments: normalized.filter((_, itemIndex) => itemIndex !== index),
    });
    setConfirming(null);
  };

  return (
    <section className="profile-tournaments">
      <header>
        <div>
          <p>Competition record</p>
          <h2>Tournament history</h2>
        </div>
        {own ? (
          <Button
            className="profile-career-add"
            size="small"
            variant="secondary"
            onClick={() => begin("new")}
          >
            <Plus size={13} />
            Add tournament
          </Button>
        ) : null}
      </header>
      {sorted.length ? (
        <>
          <div className="profile-tournament-list">
            {visibleTournaments.map(({ item, index }) => {
              const date = tournamentDate(item);
              const upcoming =
                item.status === "upcoming" || Boolean(date && date.getTime() > Date.now());
              return (
                <article key={item.id || index}>
                  <div className="profile-tournament-date">
                    <CalendarDays size={15} />
                    <time dateTime={item.date}>
                      {date
                        ? date.toLocaleDateString(undefined, {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "Date not shared"}
                    </time>
                  </div>
                  <div>
                    <span>
                      {upcoming ? "Upcoming" : item.placement === 1 ? "Victory" : "Completed"}
                    </span>
                    <h3>{tournamentName(item)}</h3>
                    <p>
                      {tournamentGame(item)}
                      {item.organizer || item.tournament?.organizer
                        ? ` · ${item.organizer || item.tournament?.organizer}`
                        : ""}
                    </p>
                  </div>
                  <div className="profile-tournament-result">
                    {item.placement != null ? (
                      <strong>
                        #{item.placement}
                        {item.totalParticipants ? ` / ${item.totalParticipants}` : ""}
                      </strong>
                    ) : (
                      <strong>{upcoming ? "Scheduled" : "Participated"}</strong>
                    )}
                    {item.prizePool != null ? <small>Pool {String(item.prizePool)}</small> : null}
                  </div>
                  {item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Open ${tournamentName(item)} details`}
                    >
                      <ArrowUpRight size={14} />
                    </a>
                  ) : null}
                  {own ? (
                    <footer>
                      <button type="button" onClick={() => begin(index)}>
                        <Edit3 size={13} />
                        Edit
                      </button>
                      <button
                        type="button"
                        data-confirm={confirming === index}
                        onClick={() =>
                          confirming === index ? void remove(index) : setConfirming(index)
                        }
                      >
                        {confirming === index ? (
                          "Confirm remove"
                        ) : (
                          <>
                            <Trash2 size={13} />
                            Remove
                          </>
                        )}
                      </button>
                    </footer>
                  ) : null}
                </article>
              );
            })}
          </div>
          {sorted.length > 4 ? (
            <button
              type="button"
              className="profile-collection-more"
              aria-expanded={expanded}
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? "Show fewer tournaments" : `View all ${sorted.length} tournaments`}
            </button>
          ) : null}
        </>
      ) : (
        <p className="profile-panel-empty">
          {own
            ? "Add verified or self-reported tournament participation to build your competitive record."
            : "This player has not shared tournament history yet."}
        </p>
      )}
      {update.isError ? (
        <p className="profile-inline-action-error" role="alert">
          {getApiErrorMessage(update.error, "Tournament history could not be updated.")}
        </p>
      ) : null}
      {editing !== null ? (
        <ProfileDialog
          title={editing === "new" ? "Add tournament" : "Edit tournament"}
          onClose={() => !update.isPending && setEditing(null)}
        >
          <form
            className="profile-interaction-form"
            onSubmit={(event) => {
              event.preventDefault();
              void save();
            }}
          >
            <div className="profile-interaction-form__grid">
              <label>
                <span>Tournament name</span>
                <input
                  value={draft.name}
                  maxLength={120}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                <span>Game</span>
                {gameOptions.length ? (
                  <select
                    value={draft.game}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        game: event.target.value,
                      }))
                    }
                  >
                    <option value="">Select a profile game</option>
                    {gameOptions.map((game) => (
                      <option key={game}>{game}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={draft.game}
                    maxLength={80}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        game: event.target.value,
                      }))
                    }
                  />
                )}
              </label>
              <label>
                <span>Date</span>
                <input
                  type="date"
                  value={draft.date}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      date: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                <span>Status</span>
                <select
                  value={draft.status}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      status: event.target.value as TournamentDraft["status"],
                    }))
                  }
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="completed">Completed</option>
                </select>
              </label>
              <label>
                <span>
                  Placement <small>Optional</small>
                </span>
                <input
                  type="number"
                  min="1"
                  value={draft.placement}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      placement: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                <span>
                  Participants <small>Optional</small>
                </span>
                <input
                  type="number"
                  min="1"
                  value={draft.totalParticipants}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      totalParticipants: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                <span>Organizer</span>
                <input
                  value={draft.organizer}
                  maxLength={100}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      organizer: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                <span>
                  Prize pool <small>Optional</small>
                </span>
                <input
                  value={draft.prizePool}
                  maxLength={60}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      prizePool: event.target.value,
                    }))
                  }
                />
              </label>
            </div>
            <label>
              <span>
                Details link <small>Optional</small>
              </span>
              <input
                type="url"
                value={draft.url}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    url: event.target.value,
                  }))
                }
                placeholder="https://"
              />
            </label>
            {update.isError ? (
              <p className="profile-inline-action-error" role="alert">
                {getApiErrorMessage(update.error, "Tournament history could not be saved.")}
              </p>
            ) : null}
            <footer>
              <Button variant="quiet" disabled={update.isPending} onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  update.isPending ||
                  !draft.name.trim() ||
                  !draft.game.trim() ||
                  !draft.date ||
                  !draft.organizer.trim()
                }
              >
                {update.isPending ? "Saving…" : "Save tournament"}
              </Button>
            </footer>
          </form>
        </ProfileDialog>
      ) : null}
    </section>
  );
}

export function ProfileCareer({ own, profile }: { own: boolean; profile: PlayerProfile }) {
  const teams = useProfileTeams(profile.id);
  return (
    <div className="profile-career-layout">
      <section className="profile-career-summary" aria-label="Career summary">
        <div>
          <Briefcase size={15} />
          <span>Current teams</span>
          <strong>{teams.data?.length ?? "—"}</strong>
        </div>
        <div>
          <Trophy size={15} />
          <span>Tournament victories</span>
          <strong>{profile.stats?.tournamentWins ?? 0}</strong>
        </div>
        <div>
          <CalendarDays size={15} />
          <span>Recorded events</span>
          <strong>{profile.tournaments?.length ?? 0}</strong>
        </div>
      </section>
      <TeamsPanel profile={profile} query={teams} />
      <TournamentsPanel own={own} profile={profile} />
      <MilestonesPanel own={own} profile={profile} />
      <SalaryInsights own={own} profile={profile} />
    </div>
  );
}
