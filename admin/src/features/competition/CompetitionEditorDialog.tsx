import { useEffect, useId, useState, type FormEvent } from "react";
import { getErrorMessage } from "../../lib/errors";
import type {
  AdminAchievementInput,
  AdminAchievementRecord,
  AdminTournamentInput,
  AdminTournamentRecord,
  CompetitionView,
} from "./types";

type EditorRecord = AdminTournamentRecord | AdminAchievementRecord | null;

interface Props {
  open: boolean;
  view: CompetitionView;
  record: EditorRecord;
  busy: boolean;
  error?: unknown;
  onClose: () => void;
  onSaveTournament: (input: AdminTournamentInput) => void;
  onSaveAchievement: (input: AdminAchievementInput) => void;
}

const localDate = (value?: string) => (value ? new Date(value).toISOString().slice(0, 16) : "");

export function CompetitionEditorDialog(props: Props) {
  const titleId = useId();
  const [form, setForm] = useState<Record<string, string>>({});
  const [file, setFile] = useState<File | null>(null);
  const tournament =
    props.view === "tournaments" ? (props.record as AdminTournamentRecord | null) : null;
  const achievement =
    props.view === "achievements" ? (props.record as AdminAchievementRecord | null) : null;

  useEffect(() => {
    if (!props.open) return;
    setFile(null);
    setForm(
      tournament
        ? {
            name: tournament.name,
            description: tournament.description,
            game: tournament.game,
            platform: tournament.platform,
            platformUrl: tournament.platformUrl,
            organizer: tournament.organizer ?? "",
            region: tournament.region ?? "",
            format: tournament.format,
            skillLevel: tournament.skillLevel ?? "",
            status: tournament.status,
            prizePool: String(tournament.prizePool),
            teamSize: String(tournament.teamSize ?? 1),
            currentTeams: String(tournament.currentTeams ?? 0),
            maxTeams: String(tournament.maxTeams ?? 0),
            totalParticipants: String(tournament.totalParticipants ?? 0),
            startDate: localDate(tournament.startDate),
            endDate: localDate(tournament.endDate),
            registrationDeadline: localDate(tournament.registrationDeadline),
          }
        : achievement
          ? {
              title: achievement.title,
              description: achievement.description,
              category: achievement.category,
              game: achievement.game,
              points: String(achievement.points),
              progress: String(achievement.progress),
              maxProgress: String(achievement.maxProgress),
              icon: achievement.icon,
            }
          : props.view === "tournaments"
            ? {
                status: "upcoming",
                teamSize: "1",
                currentTeams: "0",
                maxTeams: "0",
                totalParticipants: "0",
                prizePool: "0",
              }
            : { category: "competitor", points: "0", progress: "0", maxProgress: "1" },
    );
  }, [achievement, props.open, props.view, tournament]);

  if (!props.open) return null;
  const set = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (props.view === "tournaments") {
      props.onSaveTournament({
        name: form.name,
        description: form.description,
        game: form.game,
        platform: form.platform,
        platformUrl: form.platformUrl,
        organizer: form.organizer,
        region: form.region,
        format: form.format,
        skillLevel: form.skillLevel,
        status: form.status as AdminTournamentInput["status"],
        prizePool: Number(form.prizePool),
        teamSize: Number(form.teamSize),
        currentTeams: Number(form.currentTeams),
        maxTeams: Number(form.maxTeams),
        totalParticipants: Number(form.totalParticipants),
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
        registrationDeadline: new Date(form.registrationDeadline).toISOString(),
        file,
      });
    } else {
      props.onSaveAchievement({
        title: form.title,
        description: form.description,
        category: form.category as AdminAchievementInput["category"],
        game: form.game ?? "",
        points: Number(form.points),
        progress: Number(form.progress),
        maxProgress: Number(form.maxProgress),
        icon: form.icon ?? "",
      });
    }
  };
  const field = (key: string, label: string, options?: { type?: string; required?: boolean }) => (
    <label>
      <span>{label}</span>
      <input
        type={options?.type ?? "text"}
        value={form[key] ?? ""}
        onChange={(event) => set(key, event.target.value)}
        required={options?.required !== false}
      />
    </label>
  );

  return (
    <div
      className="admin-dialog admin-competition-dialog"
      role="presentation"
      onMouseDown={props.onClose}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onSubmit={submit}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <span className="admin-eyebrow">Audited competition record</span>
          <h2 id={titleId}>
            {props.record ? "Edit" : "Add"}{" "}
            {props.view === "tournaments" ? "tournament" : "achievement"}
          </h2>
          <p>
            Dates, rewards, eligibility context, and media are validated by the server before the
            change enters the audit trail.
          </p>
        </header>
        <div className="admin-competition-form">
          {props.view === "tournaments" ? (
            <>
              {field("name", "Tournament name")}
              {field("game", "Game")}
              <label className="admin-competition-form__wide">
                <span>Description</span>
                <textarea
                  value={form.description ?? ""}
                  onChange={(event) => set("description", event.target.value)}
                  required
                  minLength={10}
                  maxLength={3000}
                />
              </label>
              {field("platform", "Platform")}
              {field("platformUrl", "Registration or platform URL", { type: "url" })}
              {field("organizer", "Organizer")}
              {field("region", "Region")}
              {field("format", "Format")}
              {field("skillLevel", "Skill level", { required: false })}
              <label>
                <span>Status</span>
                <select
                  value={form.status ?? "upcoming"}
                  onChange={(event) => set("status", event.target.value)}
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                </select>
              </label>
              {field("prizePool", "Prize pool", { type: "number" })}
              {field("teamSize", "Team size", { type: "number" })}
              {field("currentTeams", "Current teams", { type: "number" })}
              {field("maxTeams", "Maximum teams", { type: "number" })}
              {field("totalParticipants", "Participant capacity", { type: "number" })}
              {field("registrationDeadline", "Registration deadline", { type: "datetime-local" })}
              {field("startDate", "Starts", { type: "datetime-local" })}
              {field("endDate", "Ends", { type: "datetime-local" })}
              <label className="admin-competition-form__wide admin-game-file">
                <span>
                  Cover image <small>JPEG, PNG or WebP · 5 MB max</small>
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                />
              </label>
            </>
          ) : (
            <>
              {field("title", "Achievement title")}
              <label>
                <span>Category</span>
                <select
                  value={form.category ?? "competitor"}
                  onChange={(event) => set("category", event.target.value)}
                >
                  <option value="competitor">Competitor</option>
                  <option value="social">Social</option>
                  <option value="team">Team</option>
                  <option value="challenges">Challenges</option>
                  <option value="tournaments">Tournaments</option>
                </select>
              </label>
              <label className="admin-competition-form__wide">
                <span>Description</span>
                <textarea
                  value={form.description ?? ""}
                  onChange={(event) => set("description", event.target.value)}
                  required
                  maxLength={3000}
                />
              </label>
              {field("game", "Game context", { required: false })}
              {field("icon", "Icon reference", { required: false })}
              {field("points", "Reward points", { type: "number" })}
              {field("progress", "Starting progress", { type: "number" })}
              {field("maxProgress", "Completion threshold", { type: "number" })}
            </>
          )}
        </div>
        {props.error ? (
          <p className="admin-dialog__error" role="alert">
            {getErrorMessage(props.error, "This record could not be saved.")}
          </p>
        ) : null}
        <footer>
          <button
            type="button"
            className="admin-secondary-button"
            onClick={props.onClose}
            disabled={props.busy}
          >
            Cancel
          </button>
          <button type="submit" className="admin-primary-button" disabled={props.busy}>
            {props.busy ? "Saving…" : "Save record"}
          </button>
        </footer>
      </form>
    </div>
  );
}
