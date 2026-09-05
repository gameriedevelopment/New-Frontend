import { CalendarDays, Coins, Search, ShieldCheck, Swords, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Button, SearchSelect } from "../../../components/ui";
import { getApiErrorMessage } from "../../../lib/errors";
import { useUnifiedSearch } from "../../discovery/hooks";
import type { PlayerProfile } from "../../profile/types";
import { useGameOptions } from "../../profile/hooks";
import type { ProfileTeam } from "../../profile/types";
import { useCreateChallenge } from "../hooks";
import type { ChallengeType } from "../types";

const isPlayer = (value: unknown): value is PlayerProfile =>
  Boolean(value && typeof value === "object" && "username" in value && "id" in value);
const isTeam = (value: unknown): value is { id: string; name: string; level?: string } =>
  Boolean(value && typeof value === "object" && "name" in value && "id" in value);
const teamIdentity = (team: ProfileTeam) => ({
  id: team.team?.id || team.id || "",
  name: team.team?.name || team.name || "Team",
});

export function ChallengeComposer({
  currentUserId,
  ownedTeams,
  initialType = "user",
  initialTargetId = "",
  initialTargetName = "",
  onClose,
  onCreated,
}: {
  currentUserId: string;
  ownedTeams: ProfileTeam[];
  initialType?: ChallengeType;
  initialTargetId?: string;
  initialTargetName?: string;
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [type, setType] = useState<ChallengeType>(initialType);
  const [targetTerm, setTargetTerm] = useState("");
  const [targetId, setTargetId] = useState(initialTargetId);
  const [targetName, setTargetName] = useState(initialTargetName);
  const [sourceTeamId, setSourceTeamId] = useState("");
  const [gameTerm, setGameTerm] = useState("");
  const [game, setGame] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [format, setFormat] = useState("Best of 3");
  const [teamSize, setTeamSize] = useState("5");
  const [tokenAmount, setTokenAmount] = useState("0");
  const [stakes, setStakes] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const pendingRef = useRef(false);
  // Stable ref so the mount-only effect never re-runs on re-render (an unstable
  // onClose would steal focus from the form's inputs on every keystroke).
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const search = useUnifiedSearch(type === "user" ? "players" : "teams", targetTerm);
  const games = useGameOptions(gameTerm, true);
  const create = useCreateChallenge();
  const onGameSearch = useCallback((value: string) => setGameTerm(value), []);
  const sourceTeams = useMemo(
    () => ownedTeams.map(teamIdentity).filter((team) => team.id),
    [ownedTeams],
  );
  const targetOptions = useMemo(() => {
    const records = search.data?.pages.flatMap((page) => page.data) ?? [];
    return records.flatMap((item) => {
      if (type === "user" && isPlayer(item) && item.id !== currentUserId)
        return [
          {
            value: item.id,
            label: item.username,
            description: item.gamerTitle || item.gameLevel || "Gamerie player",
          },
        ];
      if (type === "team" && isTeam(item) && !sourceTeams.some((team) => team.id === item.id))
        return [{ value: item.id, label: item.name, description: item.level || "Gamerie team" }];
      return [];
    });
  }, [currentUserId, search.data, sourceTeams, type]);
  const gameOptions =
    games.data?.pages
      .flatMap((page) => page.data)
      .map((item) => ({ value: item.name, label: item.name, description: item.gameType })) ?? [];
  const timeZoneLabel =
    new Intl.DateTimeFormat(undefined, { timeZoneName: "short" })
      .formatToParts(new Date())
      .find((part) => part.type === "timeZoneName")?.value ||
    Intl.DateTimeFormat().resolvedOptions().timeZone ||
    "UTC";
  useEffect(() => {
    pendingRef.current = create.isPending;
  }, [create.isPending]);
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pendingRef.current) {
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(
          "button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]",
        ) ?? [],
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", key);
      previousFocus?.focus();
    };
  }, []);
  const chooseTarget = (value: string) => {
    setTargetId(value);
    setTargetName(targetOptions.find((item) => item.value === value)?.label || "");
  };
  const switchType = (next: ChallengeType) => {
    setType(next);
    setTargetId("");
    setTargetName("");
    setTargetTerm("");
    setErrors({});
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!targetId) nextErrors.target = `Choose a ${type === "user" ? "player" : "team"}`;
    if (type === "team" && !sourceTeamId)
      nextErrors.source = "Choose the team sending this challenge";
    if (!game) nextErrors.game = "Choose a game";
    if (!date || !time) nextErrors.schedule = "Choose a date and time";
    const scheduledDate = date && time ? new Date(`${date}T${time}`) : null;
    const scheduledIso =
      scheduledDate && !Number.isNaN(scheduledDate.getTime()) ? scheduledDate.toISOString() : null;
    if (date && time && !scheduledIso) nextErrors.schedule = "Choose a valid date and time";
    if (scheduledIso && new Date(scheduledIso).getTime() <= Date.now())
      nextErrors.schedule = "Schedule the challenge for a future time";
    if (Number(tokenAmount) < 0) nextErrors.token = "Stake cannot be negative";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length || !scheduledIso) return;
    try {
      const challenge = await create.mutateAsync({
        type,
        challengedId: type === "user" ? targetId : undefined,
        challengedTeamId: type === "team" ? targetId : undefined,
        challengerTeamId: type === "team" ? sourceTeamId : undefined,
        game,
        scheduledDate: scheduledIso,
        format,
        teamSize: type === "team" ? Number(teamSize) : undefined,
        tokenAmount: Number(tokenAmount) || 0,
        stakes: stakes.trim() || undefined,
        message: message.trim() || undefined,
      });
      onCreated(challenge.id);
    } catch {
      /* Rendered in the form. */
    }
  };
  return (
    <div
      className="challenge-compose"
      role="dialog"
      aria-modal="true"
      aria-labelledby="challenge-compose-title"
    >
      <button
        className="challenge-compose__scrim"
        type="button"
        onClick={() => {
          if (!create.isPending) onClose();
        }}
        aria-label="Close challenge composer"
      />
      <section ref={panelRef}>
        <header>
          <div>
            <p>Competitive invitation</p>
            <h2 id="challenge-compose-title">Create a challenge</h2>
            <span>Set the agreement clearly before the other side accepts.</span>
          </div>
          <button
            ref={closeRef}
            type="button"
            disabled={create.isPending}
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </header>
        <form onSubmit={(event) => void submit(event)} noValidate>
          <fieldset className="challenge-type">
            <legend>Challenge type</legend>
            <button type="button" aria-pressed={type === "user"} onClick={() => switchType("user")}>
              <Swords size={16} />
              <span>
                <strong>Player</strong>
                <small>One player against another</small>
              </span>
            </button>
            <button type="button" aria-pressed={type === "team"} onClick={() => switchType("team")}>
              <ShieldCheck size={16} />
              <span>
                <strong>Team</strong>
                <small>Your owned team against another</small>
              </span>
            </button>
          </fieldset>
          <section className="challenge-form-section">
            <header>
              <Search size={15} />
              <div>
                <h3>Participants</h3>
                <p>Choose who receives the invitation.</p>
              </div>
            </header>
            {type === "team" ? (
              <label>
                <span>Your team</span>
                <select
                  value={sourceTeamId}
                  onChange={(event) => setSourceTeamId(event.target.value)}
                  aria-invalid={Boolean(errors.source)}
                >
                  <option value="">Choose an owned team</option>
                  {sourceTeams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
                {errors.source ? <small role="alert">{errors.source}</small> : null}
              </label>
            ) : null}
            <SearchSelect
              label={type === "user" ? "Player to challenge" : "Team to challenge"}
              value={targetId}
              onChange={chooseTarget}
              onSearch={setTargetTerm}
              options={
                initialTargetId && !targetOptions.some((item) => item.value === initialTargetId)
                  ? [
                      {
                        value: initialTargetId,
                        label: targetName || initialTargetName || "Selected participant",
                      },
                      ...targetOptions,
                    ]
                  : targetOptions
              }
              loading={search.isLoading}
              loadingMore={search.isFetchingNextPage}
              hasMore={search.hasNextPage}
              onLoadMore={() => {
                if (!search.isFetchingNextPage) void search.fetchNextPage();
              }}
              emptyText={
                targetTerm
                  ? `No other ${type === "user" ? "players" : "teams"} match this search`
                  : "Start typing to search"
              }
              searchPlaceholder={type === "user" ? "Search other players" : "Search teams"}
              placeholder={type === "user" ? "Choose a player" : "Choose a team"}
            />
            {errors.target ? (
              <small className="challenge-field-error" role="alert">
                {errors.target}
              </small>
            ) : null}
          </section>
          <section className="challenge-form-section">
            <header>
              <CalendarDays size={15} />
              <div>
                <h3>Match setup</h3>
                <p>Game, format, and local schedule.</p>
              </div>
            </header>
            <SearchSelect
              label="Game"
              value={game}
              onChange={setGame}
              onSearch={onGameSearch}
              options={gameOptions}
              loading={games.isLoading}
              loadingMore={games.isFetchingNextPage}
              hasMore={games.hasNextPage}
              onLoadMore={() => {
                if (!games.isFetchingNextPage) void games.fetchNextPage();
              }}
              placeholder="Choose a game"
              searchPlaceholder="Search games"
            />
            {errors.game ? (
              <small className="challenge-field-error" role="alert">
                {errors.game}
              </small>
            ) : null}
            <div className="challenge-form-pair">
              <label>
                <span>Date</span>
                <input
                  type="date"
                  min={new Date().toISOString().slice(0, 10)}
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                />
              </label>
              <label>
                <span>Time</span>
                <input type="time" value={time} onChange={(event) => setTime(event.target.value)} />
              </label>
            </div>
            <small className="challenge-field-hint">
              Times use your timezone ({timeZoneLabel}). Each player sees the match in their own
              local time.
            </small>
            {errors.schedule ? (
              <small className="challenge-field-error" role="alert">
                {errors.schedule}
              </small>
            ) : null}
            <div className="challenge-form-pair">
              <label>
                <span>Format</span>
                <select value={format} onChange={(event) => setFormat(event.target.value)}>
                  <option>Best of 1</option>
                  <option>Best of 3</option>
                  <option>Best of 5</option>
                  <option>Custom</option>
                </select>
              </label>
              {type === "team" ? (
                <label>
                  <span>Team size</span>
                  <select value={teamSize} onChange={(event) => setTeamSize(event.target.value)}>
                    {[1, 2, 3, 4, 5].map((size) => (
                      <option key={size} value={size}>
                        {size}v{size}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </div>
          </section>
          <section className="challenge-form-section">
            <header>
              <Coins size={15} />
              <div>
                <h3>Stakes and note</h3>
                <p>Optional terms shown before acceptance.</p>
              </div>
            </header>
            <label>
              <span>
                GLK stake per side <em>Optional</em>
              </span>
              <input
                type="number"
                min="0"
                step="1"
                value={tokenAmount}
                onChange={(event) => setTokenAmount(event.target.value)}
              />
              <small>Staked tokens are reserved through the verified challenge lifecycle.</small>
            </label>
            {errors.token ? (
              <small className="challenge-field-error" role="alert">
                {errors.token}
              </small>
            ) : null}
            <label>
              <span>
                Additional stakes <em>Optional</em>
              </span>
              <input
                maxLength={160}
                value={stakes}
                onChange={(event) => setStakes(event.target.value)}
                placeholder="Non-token terms agreed by both sides"
              />
            </label>
            <label>
              <span>
                Message <em>Optional</em>
              </span>
              <textarea
                maxLength={400}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Share match context, availability, or rules."
              />
              <small>{message.length} / 400</small>
            </label>
          </section>
          {create.isError ? (
            <p className="challenge-error" role="alert">
              {getApiErrorMessage(create.error, "The challenge could not be created.")}
            </p>
          ) : null}
          <footer>
            <Button variant="quiet" disabled={create.isPending} onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? "Sending challenge…" : "Send challenge"}
            </Button>
          </footer>
        </form>
      </section>
    </div>
  );
}
