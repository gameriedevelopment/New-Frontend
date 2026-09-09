import { useEffect, useId, useState, type FormEvent } from "react";
import { useAdminGames } from "../games/hooks";
import { useAdminUsers } from "../users/hooks";
import { getErrorMessage } from "../../lib/errors";
import type {
  AdminChallengeRecord,
  AdminChallengeStatus,
  CreateAdminChallengeInput,
  UpdateAdminChallengeInput,
} from "./types";

interface Props {
  open: boolean;
  record: AdminChallengeRecord | null;
  busy: boolean;
  error?: unknown;
  onClose: () => void;
  onCreate: (input: CreateAdminChallengeInput) => void;
  onUpdate: (input: UpdateAdminChallengeInput) => void;
}

const statuses: Array<{ value: AdminChallengeStatus; label: string }> = [
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "reschedule_pending", label: "Reschedule pending" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
  { value: "expired", label: "Expired" },
];

function localDateTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function scores(record: AdminChallengeRecord | null): [string, string] {
  if (!record?.result) return ["", ""];
  if (record.result.p1Score !== undefined && record.result.p2Score !== undefined) {
    return [String(record.result.p1Score), String(record.result.p2Score)];
  }
  const parsed = /^(\d+)\s*[-:]\s*(\d+)$/.exec(record.result.score);
  return parsed ? [parsed[1], parsed[2]] : ["", ""];
}

export function ChallengeEditorDialog(props: Props) {
  const titleId = useId();
  const [player1Search, setPlayer1Search] = useState("");
  const [player2Search, setPlayer2Search] = useState("");
  const [player1Id, setPlayer1Id] = useState("");
  const [player2Id, setPlayer2Id] = useState("");
  const [gameId, setGameId] = useState("");
  const [game, setGame] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [format, setFormat] = useState("Best of 1");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<AdminChallengeStatus>("accepted");
  const [p1Score, setP1Score] = useState("");
  const [p2Score, setP2Score] = useState("");
  const [winnerId, setWinnerId] = useState("");
  const [resultNotes, setResultNotes] = useState("");
  const [reason, setReason] = useState("");
  const firstUsers = useAdminUsers(
    { page: 1, limit: 10, search: player1Search.trim() || undefined, status: "active" },
    props.open && !props.record,
  );
  const secondUsers = useAdminUsers(
    { page: 1, limit: 10, search: player2Search.trim() || undefined, status: "active" },
    props.open && !props.record,
  );
  const games = useAdminGames({ page: 1, limit: 100 }, props.open);

  useEffect(() => {
    if (!props.open) return;
    const [firstScore, secondScore] = scores(props.record);
    setPlayer1Search("");
    setPlayer2Search("");
    setPlayer1Id("");
    setPlayer2Id("");
    setGameId("");
    setGame(props.record?.game ?? "");
    setScheduledDate(
      localDateTime(props.record?.scheduledDate) || localDateTime(new Date().toISOString()),
    );
    setFormat(props.record?.format ?? "Best of 1");
    setMessage(props.record?.message ?? "");
    setStatus(props.record?.status ?? "accepted");
    setP1Score(firstScore);
    setP2Score(secondScore);
    setWinnerId(props.record?.result?.winnerId ?? "");
    setResultNotes(props.record?.result?.notes ?? "");
    setReason("");
  }, [props.open, props.record]);

  if (!props.open) return null;
  const editing = Boolean(props.record);
  const firstId =
    props.record?.type === "team" ? props.record.challengerTeamId : props.record?.challengerId;
  const secondId =
    props.record?.type === "team" ? props.record.challengedTeamId : props.record?.challengedId;
  const firstName =
    props.record?.challengerTeamName || props.record?.challengerName || "Participant 1";
  const secondName =
    props.record?.challengedTeamName || props.record?.challengedName || "Participant 2";

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!editing) {
      props.onCreate({
        player1Id,
        player2Id,
        gameId,
        scheduledDate: new Date(scheduledDate).toISOString(),
        format: format.trim(),
        message: message.trim() || undefined,
      });
      return;
    }
    props.onUpdate({
      game: game.trim(),
      scheduledDate: new Date(scheduledDate).toISOString(),
      format: format.trim(),
      message: message.trim(),
      status,
      ...(status === "completed"
        ? {
            p1Score: Number(p1Score),
            p2Score: Number(p2Score),
            winnerId,
            resultNotes: resultNotes.trim(),
          }
        : {}),
      reason: reason.trim(),
    });
  };

  return (
    <div className="admin-dialog" role="presentation" onMouseDown={props.onClose}>
      <form
        className="admin-challenge-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onSubmit={submit}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <h2 id={titleId}>{editing ? "Manage challenge" : "Create challenge"}</h2>
          <p>
            {editing
              ? "Correct challenge details and results. Completed-result changes update platform statistics automatically."
              : "Create an admin-managed player match without requiring participant approval."}
          </p>
        </header>
        <div className="admin-competition-form">
          {!editing ? (
            <>
              <label>
                <span>Find player 1</span>
                <input
                  value={player1Search}
                  onChange={(event) => setPlayer1Search(event.target.value)}
                  placeholder="Search username"
                />
                <select
                  required
                  value={player1Id}
                  onChange={(event) => setPlayer1Id(event.target.value)}
                >
                  <option value="">Select player 1</option>
                  {firstUsers.data?.data.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.username}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Find player 2</span>
                <input
                  value={player2Search}
                  onChange={(event) => setPlayer2Search(event.target.value)}
                  placeholder="Search username"
                />
                <select
                  required
                  value={player2Id}
                  onChange={(event) => setPlayer2Id(event.target.value)}
                >
                  <option value="">Select player 2</option>
                  {secondUsers.data?.data.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.username}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Game</span>
                <select required value={gameId} onChange={(event) => setGameId(event.target.value)}>
                  <option value="">Select game</option>
                  {games.data?.data.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
            </>
          ) : (
            <>
              <label>
                <span>Game</span>
                <input
                  required
                  list="admin-challenge-games"
                  value={game}
                  onChange={(event) => setGame(event.target.value)}
                />
                <datalist id="admin-challenge-games">
                  {games.data?.data.map((item) => (
                    <option key={item.id} value={item.name} />
                  ))}
                </datalist>
              </label>
              <label>
                <span>Status</span>
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value as AdminChallengeStatus)}
                >
                  {statuses.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}
          <label>
            <span>Scheduled date</span>
            <input
              required
              type="datetime-local"
              value={scheduledDate}
              onChange={(event) => setScheduledDate(event.target.value)}
            />
          </label>
          <label>
            <span>Format</span>
            <input
              required
              minLength={2}
              value={format}
              onChange={(event) => setFormat(event.target.value)}
              placeholder="Best of 1"
            />
          </label>
          <label className="admin-competition-form__wide">
            <span>Message</span>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={1000}
            />
          </label>
          {editing && status === "completed" ? (
            <>
              <label>
                <span>{firstName} score</span>
                <input
                  required
                  type="number"
                  min="0"
                  max="9999"
                  value={p1Score}
                  onChange={(event) => setP1Score(event.target.value)}
                />
              </label>
              <label>
                <span>{secondName} score</span>
                <input
                  required
                  type="number"
                  min="0"
                  max="9999"
                  value={p2Score}
                  onChange={(event) => setP2Score(event.target.value)}
                />
              </label>
              <label className="admin-competition-form__wide">
                <span>Winner</span>
                <select
                  required
                  value={winnerId}
                  onChange={(event) => setWinnerId(event.target.value)}
                >
                  <option value="">Select winner</option>
                  <option value={firstId ?? ""}>{firstName}</option>
                  <option value={secondId ?? ""}>{secondName}</option>
                  <option value="draw">Draw</option>
                </select>
              </label>
              <label className="admin-competition-form__wide">
                <span>Result notes</span>
                <textarea
                  value={resultNotes}
                  onChange={(event) => setResultNotes(event.target.value)}
                  maxLength={1000}
                />
              </label>
            </>
          ) : null}
          {editing ? (
            <label className="admin-competition-form__wide">
              <span>Reason for change</span>
              <textarea
                required
                minLength={5}
                maxLength={500}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
            </label>
          ) : null}
        </div>
        {props.error ? (
          <p className="admin-dialog__error" role="alert">
            {getErrorMessage(props.error, "The challenge could not be saved.")}
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
          <button
            type="submit"
            className="admin-primary-button"
            disabled={
              props.busy ||
              (!editing && (!player1Id || !player2Id || !gameId)) ||
              (editing && reason.trim().length < 5)
            }
          >
            {props.busy ? "Saving…" : editing ? "Save changes" : "Create challenge"}
          </button>
        </footer>
      </form>
    </div>
  );
}
