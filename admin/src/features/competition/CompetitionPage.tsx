import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AdminAvatar } from "../../components/AdminAvatar";
import { DetailDrawer, DetailList } from "../../components/DetailDrawer";
import { DirectoryView } from "../../components/DirectoryView";
import { getErrorMessage } from "../../lib/errors";
import { CompetitionDeleteDialog } from "./CompetitionDeleteDialog";
import { CompetitionEditorDialog } from "./CompetitionEditorDialog";
import {
  useAdminAchievements,
  useAdminTournaments,
  useDeleteCompetition,
  useSaveAchievement,
  useSaveTournament,
} from "./hooks";
import type {
  AdminAchievementInput,
  AdminAchievementRecord,
  AdminTournamentInput,
  AdminTournamentRecord,
  CompetitionView,
} from "./types";
import "./competition.css";

type RecordSelection = AdminTournamentRecord | AdminAchievementRecord;

export function CompetitionPage() {
  const [params, setParams] = useSearchParams();
  const view: CompetitionView =
    params.get("view") === "achievements" ? "achievements" : "tournaments";
  const [search, setSearch] = useState("");
  const [term, setTerm] = useState("");
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<RecordSelection | null>(null);
  const [editing, setEditing] = useState<RecordSelection | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<RecordSelection | null>(null);
  const tournaments = useAdminTournaments({
    page,
    limit: 20,
    search: term || undefined,
    status: view === "tournaments" && filter ? (filter as never) : undefined,
  });
  const achievements = useAdminAchievements({
    page,
    limit: 20,
    search: term || undefined,
    category: view === "achievements" && filter ? (filter as never) : undefined,
  });
  const query = view === "tournaments" ? tournaments : achievements;
  const saveTournament = useSaveTournament();
  const saveAchievement = useSaveAchievement();
  const remove = useDeleteCompetition();
  const records = query.data?.data as RecordSelection[] | undefined;

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
  const busy = saveTournament.isPending || saveAchievement.isPending;
  const saveError = saveTournament.error || saveAchievement.error;
  const closeEditor = () => {
    if (!busy) {
      saveTournament.reset();
      saveAchievement.reset();
      setEditing(undefined);
    }
  };

  return (
    <>
      <DirectoryView
        eyebrow="Competition catalogue"
        title={view === "tournaments" ? "Tournaments" : "Achievements"}
        description={
          view === "tournaments"
            ? "Maintain dates, eligibility, rewards, registration context, and trusted tournament media."
            : "Maintain achievement definitions, progression thresholds, reward points, and their competition context."
        }
        search={search}
        searchPlaceholder={
          view === "tournaments"
            ? "Search tournament, game, or organizer"
            : "Search achievement, game, or description"
        }
        onSearch={setSearch}
        filters={
          <>
            <div className="admin-competition-switch" aria-label="Competition catalogue">
              <button
                className={view === "tournaments" ? "is-active" : ""}
                onClick={() => changeView("tournaments")}
              >
                Tournaments
              </button>
              <button
                className={view === "achievements" ? "is-active" : ""}
                onClick={() => changeView("achievements")}
              >
                Achievements
              </button>
            </div>
            <select
              aria-label={view === "tournaments" ? "Tournament status" : "Achievement category"}
              value={filter}
              onChange={(event) => {
                setFilter(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All {view === "tournaments" ? "statuses" : "categories"}</option>
              {view === "tournaments" ? (
                <>
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
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
          </>
        }
        action={
          <button
            className="admin-primary-button"
            onClick={() => {
              saveTournament.reset();
              saveAchievement.reset();
              setEditing(null);
            }}
          >
            Add {view === "tournaments" ? "tournament" : "achievement"}
          </button>
        }
        loading={query.isLoading}
        error={
          query.isError ? getErrorMessage(query.error, `${view} could not be loaded.`) : undefined
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
        eyebrow={view === "tournaments" ? "Tournament record" : "Achievement definition"}
        title={
          selected ? ("name" in selected ? selected.name : selected.title) : "Competition details"
        }
        subtitle={selected?.description}
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
          ) : (
            <AchievementDetails record={selected as AdminAchievementRecord} />
          )
        ) : null}
      </DetailDrawer>
      <CompetitionEditorDialog
        open={editing !== undefined}
        view={view}
        record={editing ?? null}
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
      <CompetitionDeleteDialog
        open={Boolean(deleting)}
        name={deleting ? ("name" in deleting ? deleting.name : deleting.title) : "this record"}
        kind={view === "tournaments" ? "tournament" : "achievement"}
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
              kind: view === "tournaments" ? "tournament" : "achievement",
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
