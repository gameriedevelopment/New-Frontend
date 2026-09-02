import { CalendarPlus, ChevronLeft, Clock3, X } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, SearchSelect } from "../../../components/ui";
import { getApiErrorMessage } from "../../../lib/errors";
import { getTimezoneOptions } from "../../communities/options";
import { useDebouncedValue } from "../../discovery/hooks";
import { useGames } from "../../games/hooks";
import { useProfileTeams } from "../../profile/hooks";
import { useCreateCalendarEvent } from "../hooks";
import type { CalendarEventType } from "../types";
import { zonedDateTimeToIso } from "../utils";

function wallValue(date: Date, timeZone: string) {
  const values = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
}

function shiftWall(value: string, minutes: number) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return "";
  const date = new Date(`${value}:00Z`);
  date.setUTCMinutes(date.getUTCMinutes() + minutes);
  return date.toISOString().slice(0, 16);
}

export function CalendarComposer({
  currentUserId,
  defaultTimeZone,
  onClose,
}: {
  currentUserId: string;
  defaultTimeZone: string;
  onClose: () => void;
}) {
  const now = new Date();
  now.setMinutes(now.getMinutes() < 30 ? 30 : 60, 0, 0);
  const initialStart = wallValue(now, defaultTimeZone);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<Exclude<CalendarEventType, "tournament">>("match");
  const [start, setStart] = useState(initialStart);
  const [end, setEnd] = useState(shiftWall(initialStart, 60));
  const [description, setDescription] = useState("");
  const [game, setGame] = useState("");
  const [team, setTeam] = useState("");
  const [location, setLocation] = useState("");
  const [reminder, setReminder] = useState("15");
  const [timeZone, setTimeZone] = useState(defaultTimeZone);
  const [gameSearch, setGameSearch] = useState("");
  const [timezoneSearch, setTimezoneSearch] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const panel = useRef<HTMLElement>(null);
  const titleInput = useRef<HTMLInputElement>(null);
  const dirtyRef = useRef(false);
  const discardRef = useRef(false);
  const create = useCreateCalendarEvent();
  const games = useGames({ search: useDebouncedValue(gameSearch, 220) || undefined });
  const teams = useProfileTeams(currentUserId);
  const dirty = Boolean(
    title ||
    description ||
    game ||
    team ||
    location ||
    type !== "match" ||
    start !== initialStart ||
    reminder !== "15",
  );
  dirtyRef.current = dirty;
  discardRef.current = confirmDiscard;
  const allTimezones = useMemo(() => getTimezoneOptions(), []);
  const timezoneOptions = useMemo(() => {
    const search = timezoneSearch.toLowerCase().trim();
    return (
      search
        ? allTimezones.filter(
            (item) =>
              item.label.toLowerCase().includes(search) ||
              item.value.toLowerCase().includes(search),
          )
        : allTimezones
    ).slice(0, 80);
  }, [allTimezones, timezoneSearch]);
  const gameOptions = useMemo(
    () =>
      games.data?.pages
        .flatMap((page) => page.data)
        .map((item) => ({ value: item.name, label: item.name, description: item.gameType })) ?? [],
    [games.data],
  );
  const teamOptions = useMemo(
    () =>
      (teams.data ?? []).flatMap((entry) => {
        const item = entry.team || entry;
        return item.id && item.name
          ? [{ value: item.id, label: item.name, description: entry.title || entry.role }]
          : [];
      }),
    [teams.data],
  );
  const close = useCallback(() => {
    if (dirtyRef.current && !discardRef.current) {
      setConfirmDiscard(true);
      return;
    }
    onClose();
  }, [onClose]);
  // Stable ref so the mount-only effect never re-runs on re-render (which would
  // steal focus from the form's inputs on every keystroke).
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = requestAnimationFrame(() => titleInput.current?.focus());
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeRef.current();
      if (event.key !== "Tab" || !panel.current) return;
      const nodes = [
        ...panel.current.querySelectorAll<HTMLElement>(
          "button:not(:disabled),input:not(:disabled),textarea:not(:disabled),select:not(:disabled)",
        ),
      ];
      if (!nodes.length) return;
      const first = nodes[0],
        last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", key);
    const unload = (event: BeforeUnloadEvent) => {
      if (dirtyRef.current) event.preventDefault();
    };
    window.addEventListener("beforeunload", unload);
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", key);
      window.removeEventListener("beforeunload", unload);
    };
  }, []);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!title.trim()) next.title = "Add a clear event title.";
    let startIso = "",
      endIso = "";
    try {
      startIso = zonedDateTimeToIso(start, timeZone);
      endIso = zonedDateTimeToIso(end, timeZone);
      if (new Date(startIso) <= new Date()) next.schedule = "Start time must be in the future.";
      else if (new Date(endIso) <= new Date(startIso))
        next.schedule = "End time must be after the start time.";
    } catch {
      next.schedule = "Choose a valid schedule.";
    }
    setErrors(next);
    if (Object.keys(next).length) return;
    const offset = Number(reminder);
    await create.mutateAsync({
      type,
      title: title.trim(),
      description: description.trim() || undefined,
      startTime: startIso,
      endTime: endIso,
      game: game || undefined,
      team: team || undefined,
      location: location.trim() || undefined,
      status: "upcoming",
      reminders: offset
        ? [
            {
              time: new Date(new Date(startIso).getTime() - offset * 60_000).toISOString(),
              method: "notification",
            },
          ]
        : undefined,
    });
    onClose();
  };
  return (
    <div
      className="calendar-compose"
      role="dialog"
      aria-modal="true"
      aria-labelledby="calendar-compose-title"
    >
      <button
        className="calendar-sheet__scrim"
        type="button"
        onClick={close}
        aria-label="Close event composer"
      />
      <section ref={panel}>
        <header>
          <button className="calendar-compose__back" type="button" onClick={close}>
            <ChevronLeft size={17} />
            Calendar
          </button>
          <div>
            <span>Personal schedule</span>
            <h2 id="calendar-compose-title">Add an event</h2>
          </div>
          <button type="button" onClick={close} aria-label="Close">
            <X size={18} />
          </button>
        </header>
        <form onSubmit={submit}>
          <div className="calendar-compose__intro">
            <CalendarPlus size={18} />
            <p>Keep one private schedule across personal plans, challenges, and tournaments.</p>
          </div>
          <label className="calendar-field calendar-field--title">
            <span>Event title</span>
            <input
              ref={titleInput}
              maxLength={255}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Team review before qualifiers"
            />
            {errors.title ? <small role="alert">{errors.title}</small> : null}
          </label>
          <div className="calendar-form-pair">
            <label className="calendar-field">
              <span>Event type</span>
              <select value={type} onChange={(event) => setType(event.target.value as typeof type)}>
                <option value="match">Match</option>
                <option value="practice">Practice</option>
                <option value="team_meeting">Team meeting</option>
                <option value="personal">Personal</option>
              </select>
            </label>
            <label className="calendar-field">
              <span>Reminder</span>
              <select value={reminder} onChange={(event) => setReminder(event.target.value)}>
                <option value="0">No reminder</option>
                <option value="15">15 minutes before</option>
                <option value="60">1 hour before</option>
                <option value="1440">1 day before</option>
              </select>
            </label>
          </div>
          <section className="calendar-compose__schedule">
            <header>
              <Clock3 size={15} />
              <div>
                <strong>Schedule</strong>
                <small>Times are saved in the timezone below.</small>
              </div>
            </header>
            <div className="calendar-form-pair">
              <label className="calendar-field">
                <span>Starts</span>
                <input
                  type="datetime-local"
                  value={start}
                  onChange={(event) => {
                    setStart(event.target.value);
                    setEnd(shiftWall(event.target.value, 60));
                  }}
                />
              </label>
              <label className="calendar-field">
                <span>Ends</span>
                <input
                  type="datetime-local"
                  value={end}
                  min={start}
                  onChange={(event) => setEnd(event.target.value)}
                />
              </label>
            </div>
            {errors.schedule ? (
              <p className="calendar-inline-error" role="alert">
                {errors.schedule}
              </p>
            ) : null}
            <SearchSelect
              label="Timezone"
              value={timeZone}
              onChange={setTimeZone}
              onSearch={setTimezoneSearch}
              options={timezoneOptions}
              placeholder="Choose timezone"
              searchPlaceholder="Search city or timezone"
              emptyText="No matching timezones"
            />
          </section>
          <div className="calendar-form-pair">
            <SearchSelect
              label="Game (optional)"
              value={game}
              onChange={setGame}
              onSearch={setGameSearch}
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
            {teamOptions.length ? (
              <SearchSelect
                label="Team calendar (optional)"
                value={team}
                onChange={setTeam}
                onSearch={() => undefined}
                options={teamOptions}
                loading={teams.isLoading}
                placeholder="Personal calendar"
                searchPlaceholder="Search your teams"
              />
            ) : (
              <label className="calendar-field">
                <span>Location (optional)</span>
                <input
                  maxLength={255}
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="Online, venue, or voice channel"
                />
              </label>
            )}
          </div>
          {teamOptions.length ? (
            <label className="calendar-field">
              <span>Location (optional)</span>
              <input
                maxLength={255}
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Online, venue, or voice channel"
              />
            </label>
          ) : null}
          <label className="calendar-field">
            <span>Notes (optional)</span>
            <textarea
              maxLength={2000}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Add preparation notes or useful context."
            />
            <small>{description.length} / 2000</small>
          </label>
          {create.isError ? (
            <p className="calendar-inline-error" role="alert">
              {getApiErrorMessage(create.error, "The event could not be created.")}
            </p>
          ) : null}
          {confirmDiscard ? (
            <div className="calendar-discard" role="alert">
              <p>
                <strong>Discard this draft?</strong>
                <span>Your event has not been saved.</span>
              </p>
              <button type="button" onClick={() => setConfirmDiscard(false)}>
                Keep editing
              </button>
              <button type="button" onClick={onClose}>
                Discard
              </button>
            </div>
          ) : null}
          <footer>
            <Button variant="quiet" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? "Adding event…" : "Add to calendar"}
            </Button>
          </footer>
        </form>
      </section>
    </div>
  );
}
