import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AdminAvatar } from "../../components/AdminAvatar";
import { DetailDrawer, DetailList } from "../../components/DetailDrawer";
import { DirectoryView } from "../../components/DirectoryView";
import { getErrorMessage } from "../../lib/errors";
import { ChallengeEditorDialog } from "./ChallengeEditorDialog";
import { CompetitionDeleteDialog } from "./CompetitionDeleteDialog";
import { CompetitionEditorDialog } from "./CompetitionEditorDialog";
import {
  useAdminAchievements,
  useAdminChallenges,
  useAdminTournaments,
  useDeleteCompetition,
  useSaveAchievement,
  useSaveChallenge,
  useSaveTournament,
} from "./hooks";
import type {
  AdminAchievementInput,
  AdminAchievementRecord,
  AdminChallengeRecord,
  AdminChallengeStatus,
  AdminTournamentInput,
  AdminTournamentRecord,
  CompetitionView,
} from "./types";
import "./competition.css";

type RecordSelection = AdminTournamentRecord | AdminChallengeRecord | AdminAchievementRecord;
const viewCopy: Record<CompetitionView, { title: string; description: string; search: string }> = {
  tournaments: {
    title: "Tournaments",
    description:
      "Maintain dates, eligibility, rewards, registration context, and trusted tournament media.",
    search: "Search tournament, game, or organizer",
  },
  challenges: {
    title: "Challenges",
    description:
      "Review player and team matches, correct disputed results, and manage administrative challenges.",
    search: "Search player, team, or game",
  },
  achievements: {
    title: "Achievements",
    description:
      "Maintain achievement definitions, progression thresholds, reward points, and their competition context.",
    search: "Search achievement, game, or description",
  },
};
const requestedView = (value: string | null): CompetitionView =>
  value === "challenges" || value === "achievements" ? value : "tournaments";

export function CompetitionPage() {
  const [params, setParams] = useSearchParams();
  const view = requestedView(params.get("view"));
  const [search, setSearch] = useState("");
  const [term, setTerm] = useState("");
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<RecordSelection | null>(null);
  const [editing, setEditing] = useState<RecordSelection | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<RecordSelection | null>(null);
  const tournaments = useAdminTournaments(
    { page, limit: 20, search: term || undefined, status: filter ? (filter as never) : undefined },
    view === "tournaments",
  );
  const challenges = useAdminChallenges(
    {
      page,
      limit: 20,
      search: term || undefined,
      status: filter ? (filter as AdminChallengeStatus) : undefined,
    },
    view === "challenges",
  );
  const achievements = useAdminAchievements(
    {
      page,
      limit: 20,
      search: term || undefined,
      category: filter ? (filter as never) : undefined,
    },
    view === "achievements",
  );
  const query =
    view === "tournaments" ? tournaments : view === "challenges" ? challenges : achievements;
  const records = query.data?.data as RecordSelection[] | undefined;
  const saveTournament = useSaveTournament();
  const saveChallenge = useSaveChallenge();
  const saveAchievement = useSaveAchievement();
  const remove = useDeleteCompetition();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setTerm(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const changeView = (next: CompetitionView) => {
    setParams(next === "tournaments" ? {} : { view: next });
    setSearch("");
    setTerm("");
    setFilter("");
    setPage(1);
    setSelected(null);
    setEditing(undefined);
  };
  const busy = saveTournament.isPending || saveChallenge.isPending || saveAchievement.isPending;
  const saveError = saveTournament.error || saveChallenge.error || saveAchievement.error;
  const resetMutations = () => {
    saveTournament.reset();
    saveChallenge.reset();
    saveAchievement.reset();
  };
  const closeEditor = () => {
    if (!busy) {
      resetMutations();
      setEditing(undefined);
    }
  };

  return (
    <>
      <DirectoryView
        title={viewCopy[view].title}
        description={viewCopy[view].description}
        search={search}
        searchPlaceholder={viewCopy[view].search}
        onSearch={setSearch}
        filters={
          <>
            <div className="admin-competition-switch" aria-label="Competition section">
              {(["tournaments", "challenges", "achievements"] as CompetitionView[]).map((item) => (
                <button
                  type="button"
                  key={item}
                  className={view === item ? "is-active" : ""}
                  onClick={() => changeView(item)}
                >
                  {viewCopy[item].title}
                </button>
              ))}
            </div>
            <CompetitionFilter
              view={view}
              value={filter}
              onChange={(value) => {
                setFilter(value);
                setPage(1);
              }}
            />
          </>
        }
        action={
          <button
            className="admin-primary-button"
            onClick={() => {
              resetMutations();
              setEditing(null);
            }}
          >
            Add{" "}
            {view === "tournaments"
              ? "tournament"
              : view === "challenges"
                ? "challenge"
                : "achievement"}
          </button>
        }
        loading={query.isLoading}
        error={
          query.isError
            ? getErrorMessage(query.error, `${viewCopy[view].title} could not be loaded.`)
            : undefined
        }
        empty={!query.isLoading && !records?.length}
        count={query.data?.total}
        page={page}
        totalPages={query.data?.totalPages ?? 0}
        onPage={setPage}
        onRetry={() => void query.refetch()}
      >
        {records?.map((record) =>
          view === "tournaments" ? (
            <TournamentRow
              key={record.id}
              record={record as AdminTournamentRecord}
              onSelect={setSelected}
              onEdit={setEditing}
            />
          ) : view === "challenges" ? (
            <ChallengeRow
              key={record.id}
              record={record as AdminChallengeRecord}
              onSelect={setSelected}
              onEdit={setEditing}
            />
          ) : (
            <AchievementRow
              key={record.id}
              record={record as AdminAchievementRecord}
              onSelect={setSelected}
              onEdit={setEditing}
            />
          ),
        )}
      </DirectoryView>
      <DetailDrawer
        open={Boolean(selected)}
        eyebrow={
          view === "challenges"
            ? "Challenge record"
            : view === "tournaments"
              ? "Tournament record"
              : "Achievement definition"
        }
        title={selected ? recordName(selected) : "Competition details"}
        subtitle={
          selected && "description" in selected
            ? selected.description
            : selected && "game" in selected
              ? selected.game
              : undefined
        }
        onClose={() => setSelected(null)}
        actions={
          selected ? (
            <>
              <button
                className="admin-secondary-button"
                onClick={() => {
                  remove.reset();
                  setDeleting(selected);
                }}
              >
                Remove
              </button>
              <button className="admin-primary-button" onClick={() => setEditing(selected)}>
                Edit record
              </button>
            </>
          ) : null
        }
      >
        {selected ? (
          view === "tournaments" ? (
            <TournamentDetails record={selected as AdminTournamentRecord} />
          ) : view === "challenges" ? (
            <ChallengeDetails record={selected as AdminChallengeRecord} />
          ) : (
            <AchievementDetails record={selected as AdminAchievementRecord} />
          )
        ) : null}
      </DetailDrawer>
      {view === "challenges" ? (
        <ChallengeEditorDialog
          open={editing !== undefined}
          record={(editing as AdminChallengeRecord | null) ?? null}
          busy={busy}
          error={saveError}
          onClose={closeEditor}
          onCreate={(input) =>
            saveChallenge.mutate(
              { input },
              {
                onSuccess: () => {
                  setEditing(undefined);
                  setSelected(null);
                },
              },
            )
          }
          onUpdate={(input) => {
            const record = editing as AdminChallengeRecord | null;
            if (record)
              saveChallenge.mutate(
                { id: record.id, input },
                {
                  onSuccess: (saved) => {
                    setEditing(undefined);
                    setSelected(saved);
                  },
                },
              );
          }}
        />
      ) : (
        <CompetitionEditorDialog
          open={editing !== undefined}
          view={view}
          record={editing as AdminTournamentRecord | AdminAchievementRecord | null}
          busy={busy}
          error={saveError}
          onClose={closeEditor}
          onSaveTournament={(input: AdminTournamentInput) =>
            saveTournament.mutate(
              { id: (editing as AdminTournamentRecord | null)?.id, input },
              {
                onSuccess: () => {
                  setEditing(undefined);
                  setSelected(null);
                },
              },
            )
          }
          onSaveAchievement={(input: AdminAchievementInput) =>
            saveAchievement.mutate(
              { id: (editing as AdminAchievementRecord | null)?.id, input },
              {
                onSuccess: () => {
                  setEditing(undefined);
                  setSelected(null);
                },
              },
            )
          }
        />
      )}
      <CompetitionDeleteDialog
        open={Boolean(deleting)}
        name={deleting ? recordName(deleting) : "this record"}
        kind={
          view === "tournaments"
            ? "tournament"
            : view === "challenges"
              ? "challenge"
              : "achievement"
        }
        busy={remove.isPending}
        error={
          remove.isError
            ? getErrorMessage(remove.error, "This record could not be removed.")
            : undefined
        }
        onClose={() => {
          if (!remove.isPending) setDeleting(null);
        }}
        onConfirm={(reason) => {
          if (!deleting) return;
          remove.mutate(
            {
              kind:
                view === "tournaments"
                  ? "tournament"
                  : view === "challenges"
                    ? "challenge"
                    : "achievement",
              id: deleting.id,
              reason,
            },
            {
              onSuccess: () => {
                setDeleting(null);
                setSelected(null);
              },
            },
          );
        }}
      />
    </>
  );
}

function CompetitionFilter({
  view,
  value,
  onChange,
}: {
  view: CompetitionView;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <select
      aria-label={`${viewCopy[view].title} filter`}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">All {view === "achievements" ? "categories" : "statuses"}</option>
      {view === "tournaments" ? (
        <>
          <option value="upcoming">Upcoming</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
        </>
      ) : view === "challenges" ? (
        <>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="reschedule_pending">Reschedule pending</option>
          <option value="completed">Completed</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
          <option value="expired">Expired</option>
        </>
      ) : (
        <>
          <option value="competitor">Competitor</option>
          <option value="social">Social</option>
          <option value="team">Team</option>
          <option value="challenges">Challenges</option>
          <option value="tournaments">Tournaments</option>
        </>
      )}
    </select>
  );
}
function participantName(record: AdminChallengeRecord, first: boolean) {
  return first
    ? record.challengerTeamName || record.challengerName || "Unknown participant"
    : record.challengedTeamName || record.challengedName || "Unknown participant";
}
function statusLabel(status: AdminChallengeStatus) {
  return status.replace(/_/g, " ");
}
function recordName(record: RecordSelection) {
  return "name" in record
    ? record.name
    : "title" in record
      ? record.title
      : `${participantName(record, true)} vs ${participantName(record, false)}`;
}

function ChallengeRow({
  record,
  onSelect,
  onEdit,
}: {
  record: AdminChallengeRecord;
  onSelect: (record: AdminChallengeRecord) => void;
  onEdit: (record: AdminChallengeRecord) => void;
}) {
  return (
    <article
      className="admin-directory-row"
      role="button"
      tabIndex={0}
      onClick={() => onSelect(record)}
      onKeyDown={(event) => {
        if (event.key === "Enter") onSelect(record);
      }}
    >
      <div className="admin-directory-identity">
        <AdminAvatar name={record.game} shape="rounded" />
        <div>
          <strong>
            {participantName(record, true)} vs {participantName(record, false)}
          </strong>
          <span>
            {record.game} · {record.type} challenge
          </span>
        </div>
      </div>
      <div className="admin-directory-meta">
        <span>Result</span>
        <strong>
          {record.result?.score || "Not recorded"} · {statusLabel(record.status)}
        </strong>
      </div>
      <div className="admin-directory-meta">
        <span>Scheduled</span>
        <strong>{new Date(record.scheduledDate).toLocaleString()}</strong>
      </div>
      <button
        className="admin-row-action"
        onClick={(event) => {
          event.stopPropagation();
          onEdit(record);
        }}
      >
        Manage
      </button>
    </article>
  );
}
function TournamentRow({
  record,
  onSelect,
  onEdit,
}: {
  record: AdminTournamentRecord;
  onSelect: (record: AdminTournamentRecord) => void;
  onEdit: (record: AdminTournamentRecord) => void;
}) {
  return (
    <article
      className="admin-directory-row"
      role="button"
      tabIndex={0}
      onClick={() => onSelect(record)}
      onKeyDown={(event) => {
        if (event.key === "Enter") onSelect(record);
      }}
    >
      <div className="admin-directory-identity">
        <AdminAvatar name={record.name} src={record.image} shape="rounded" />
        <div>
          <strong>{record.name}</strong>
          <span>
            {record.game} · {record.organizer || "Organizer not set"}
          </span>
        </div>
      </div>
      <div className="admin-directory-meta">
        <span>Schedule</span>
        <strong>
          {new Date(record.startDate).toLocaleDateString()} –{" "}
          {new Date(record.endDate).toLocaleDateString()}
        </strong>
      </div>
      <div className="admin-directory-meta">
        <span>Competition</span>
        <strong>
          {record.status} · {record.currentTeams ?? 0}/{record.maxTeams ?? 0} teams
        </strong>
      </div>
      <button
        className="admin-row-action"
        onClick={(event) => {
          event.stopPropagation();
          onEdit(record);
        }}
      >
        Edit
      </button>
    </article>
  );
}
function AchievementRow({
  record,
  onSelect,
  onEdit,
}: {
  record: AdminAchievementRecord;
  onSelect: (record: AdminAchievementRecord) => void;
  onEdit: (record: AdminAchievementRecord) => void;
}) {
  return (
    <article
      className="admin-directory-row"
      role="button"
      tabIndex={0}
      onClick={() => onSelect(record)}
      onKeyDown={(event) => {
        if (event.key === "Enter") onSelect(record);
      }}
    >
      <div className="admin-directory-identity">
        <AdminAvatar
          name={record.title}
          src={record.icon.startsWith("http") ? record.icon : undefined}
          shape="rounded"
        />
        <div>
          <strong>{record.title}</strong>
          <span>{record.game || "All games"}</span>
        </div>
      </div>
      <div className="admin-directory-meta">
        <span>Definition</span>
        <strong>
          {record.category} · {record.maxProgress} threshold
        </strong>
      </div>
      <div className="admin-directory-meta">
        <span>Impact</span>
        <strong>
          {record.awardedCount} awards · {record.points} points
        </strong>
      </div>
      <button
        className="admin-row-action"
        onClick={(event) => {
          event.stopPropagation();
          onEdit(record);
        }}
      >
        Edit
      </button>
    </article>
  );
}
const ChallengeDetails = ({ record }: { record: AdminChallengeRecord }) => (
  <DetailList
    items={[
      { label: "Challenge ID", value: record.id },
      { label: "Type", value: record.type },
      { label: "Participant 1", value: participantName(record, true) },
      { label: "Participant 2", value: participantName(record, false) },
      { label: "Game", value: record.game },
      { label: "Format", value: record.format },
      { label: "Status", value: statusLabel(record.status) },
      { label: "Score", value: record.result?.score || "Not recorded" },
      {
        label: "Winner",
        value:
          record.result?.winnerId === "draw"
            ? "Draw"
            : record.result?.winnerId === (record.challengerId || record.challengerTeamId)
              ? participantName(record, true)
              : record.result?.winnerId
                ? participantName(record, false)
                : "Not decided",
      },
      { label: "Result notes", value: record.result?.notes },
      { label: "Message", value: record.message },
      { label: "Scheduled", value: new Date(record.scheduledDate).toLocaleString() },
      { label: "Reports", value: record.reportCount },
      { label: "Calendar event", value: record.eventId },
      { label: "Created", value: new Date(record.createdAt).toLocaleString() },
      { label: "Updated", value: new Date(record.updatedAt).toLocaleString() },
    ]}
  />
);
const TournamentDetails = ({ record }: { record: AdminTournamentRecord }) => (
  <>
    <div className="admin-game-cover">
      <img
        src={record.image || ""}
        alt=""
        onError={(event) => {
          event.currentTarget.hidden = true;
        }}
      />
    </div>
    <DetailList
      items={[
        { label: "Game", value: record.game },
        { label: "Organizer", value: record.organizer },
        { label: "Status", value: record.status },
        { label: "Platform", value: record.platform },
        { label: "Region", value: record.region },
        { label: "Format", value: record.format },
        { label: "Team size", value: record.teamSize },
        { label: "Teams", value: `${record.currentTeams ?? 0} of ${record.maxTeams ?? 0}` },
        { label: "Prize pool", value: record.prizePool.toLocaleString() },
        {
          label: "Registration closes",
          value: new Date(record.registrationDeadline).toLocaleString(),
        },
        { label: "Starts", value: new Date(record.startDate).toLocaleString() },
        { label: "Ends", value: new Date(record.endDate).toLocaleString() },
        {
          label: "Registration",
          value: (
            <a href={record.platformUrl} target="_blank" rel="noreferrer">
              Open platform
            </a>
          ),
        },
      ]}
    />
  </>
);
const AchievementDetails = ({ record }: { record: AdminAchievementRecord }) => (
  <DetailList
    items={[
      { label: "Category", value: record.category },
      { label: "Game context", value: record.game || "All games" },
      { label: "Reward", value: `${record.points} points` },
      { label: "Threshold", value: record.maxProgress },
      { label: "Starting progress", value: record.progress },
      { label: "Awarded to", value: `${record.awardedCount} players` },
      { label: "Icon reference", value: record.icon || "Not set" },
      { label: "Updated", value: new Date(record.updatedAt).toLocaleString() },
    ]}
  />
);
