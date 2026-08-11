import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  List,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button, SearchSelect, Skeleton, SkeletonText, StatePanel } from "../../components/ui";
import { getApiErrorMessage } from "../../lib/errors";
import { useAuthStore } from "../auth/authStore";
import { InfiniteLoadTrigger } from "../discovery/components/InfiniteLoadTrigger";
import { useDebouncedValue } from "../discovery/hooks";
import { useGames } from "../games/hooks";
import { usePlayerSettings } from "../settings/hooks";
import { CalendarComposer } from "./components/CalendarComposer";
import { CalendarEventDetail } from "./components/CalendarEventDetail";
import { CalendarEventRow } from "./components/CalendarEventRow";
import { CalendarMonth } from "./components/CalendarMonth";
import { useCalendarAgenda, useCalendarMonth } from "./hooks";
import type { CalendarEvent, CalendarEventSource, CalendarFilters } from "./types";
import { dayKey, monthKey, monthRange, shiftMonth } from "./utils";
import "./calendar.css";

type CalendarView = "agenda" | "month";
type CalendarPeriod = "upcoming" | "past";
const validSource = (value: string | null): value is CalendarEventSource =>
  value === "manual" || value === "challenge" || value === "tournament";

function CalendarSkeleton({ month }: { month: boolean }) {
  return month ? (
    <div className="calendar-month-skeleton" aria-label="Loading month">
      <div>
        {Array.from({ length: 7 }, (_, i) => (
          <Skeleton key={i} height={12} />
        ))}
      </div>
      <section>
        {Array.from({ length: 35 }, (_, i) => (
          <Skeleton key={i} height={92} />
        ))}
      </section>
    </div>
  ) : (
    <div className="calendar-agenda-skeleton" aria-label="Loading agenda">
      {Array.from({ length: 3 }, (_, group) => (
        <section key={group}>
          <Skeleton height={18} width="18%" />
          {Array.from({ length: group === 0 ? 3 : 2 }, (_, row) => (
            <div key={row}>
              <Skeleton height={38} width={48} />
              <SkeletonText lines={2} />
              <Skeleton height={30} width={80} />
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}

export function CalendarPage() {
  const user = useAuthStore((state) => state.user);
  const settings = usePlayerSettings(user?.id);
  const requestedTimeZone =
    settings.data?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const timeZone = useMemo(() => {
    try {
      new Intl.DateTimeFormat(undefined, { timeZone: requestedTimeZone }).format();
      return requestedTimeZone;
    } catch {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    }
  }, [requestedTimeZone]);
  const [params, setParams] = useSearchParams();
  const view: CalendarView = params.get("view") === "month" ? "month" : "agenda";
  const period: CalendarPeriod = params.get("period") === "past" ? "past" : "upcoming";
  const activeMonth = /^\d{4}-\d{2}$/.test(params.get("month") || "")
    ? params.get("month")!
    : monthKey(new Date(), timeZone);
  const selectedDay = /^\d{4}-\d{2}-\d{2}$/.test(params.get("day") || "")
    ? params.get("day")!
    : dayKey(new Date(), timeZone);
  const source = validSource(params.get("source"))
    ? (params.get("source") as CalendarEventSource)
    : undefined;
  const type = params.get("type") || undefined;
  const status = params.get("status") || undefined;
  const game = params.get("game") || undefined;
  const search = params.get("q") || "";
  const debouncedSearch = useDebouncedValue(search, 260);
  const [filtersOpen, setFiltersOpen] = useState(Boolean(source || type || status || game));
  const [gameSearch, setGameSearch] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const change = useCallback(
    (key: string, value?: string) => {
      const next = new URLSearchParams(params);
      value ? next.set(key, value) : next.delete(key);
      setParams(next, { replace: true });
    },
    [params, setParams],
  );
  const selectMonth = useCallback(
    (nextMonth: string, nextDay = `${nextMonth}-01`) => {
      const next = new URLSearchParams(params);
      next.set("month", nextMonth);
      next.set("day", nextDay);
      setParams(next, { replace: true });
    },
    [params, setParams],
  );
  const resetFilters = () => {
    const next = new URLSearchParams(params);
    ["source", "type", "status", "game", "q"].forEach((key) => next.delete(key));
    setParams(next, { replace: true });
  };
  const applied = [source, type, status, game].filter(Boolean).length;
  const gameQuery = useGames(
    { search: useDebouncedValue(gameSearch, 220) || undefined },
    filtersOpen,
  );
  const gameOptions = useMemo(() => {
    const options = new Map(
      (gameQuery.data?.pages.flatMap((page) => page.data) ?? []).map((item) => [item.name, item]),
    );
    if (game && !options.has(game)) options.set(game, { id: game, name: game });
    return Array.from(options.values()).map((item) => ({
      value: item.name,
      label: item.name,
      description: item.gameType,
    }));
  }, [game, gameQuery.data]);
  const baseFilters = useMemo<CalendarFilters>(
    () => ({ searchTerm: debouncedSearch || undefined, sourceType: source, type, status, game }),
    [debouncedSearch, game, source, status, type],
  );
  const agendaRange = useMemo(() => {
    const nowMonth = monthKey(new Date(), timeZone);
    if (period === "past")
      return {
        startDate: monthRange(shiftMonth(nowMonth, -24), timeZone).startDate,
        endDate: new Date().toISOString(),
        order: "desc" as const,
      };
    return {
      startDate: new Date().toISOString(),
      endDate: monthRange(shiftMonth(nowMonth, 12), timeZone).endDate,
      order: "asc" as const,
    };
  }, [period, timeZone]);
  const agendaFilters = useMemo(
    () => ({ ...baseFilters, ...agendaRange }),
    [agendaRange, baseFilters],
  );
  const monthFilters = useMemo(
    () => ({ ...baseFilters, ...monthRange(activeMonth, timeZone), order: "asc" as const }),
    [activeMonth, baseFilters, timeZone],
  );
  const agenda = useCalendarAgenda(agendaFilters, view === "agenda");
  const month = useCalendarMonth(monthFilters, view === "month");
  const agendaEvents = agenda.data?.pages.flatMap((page) => page.events) ?? [];
  const monthEvents = month.data?.pages.flatMap((page) => page.events) ?? [];
  useEffect(() => {
    if (view === "month" && !month.isError && month.hasNextPage && !month.isFetchingNextPage)
      void month.fetchNextPage();
  }, [month.fetchNextPage, month.hasNextPage, month.isError, month.isFetchingNextPage, view]);
  const groups = agendaEvents.reduce<Record<string, CalendarEvent[]>>((result, event) => {
    const key = dayKey(event.startTime, timeZone);
    (result[key] ||= []).push(event);
    return result;
  }, {});
  const selectedEvents = monthEvents.filter(
    (event) => dayKey(event.startTime, timeZone) === selectedDay,
  );
  const visibleQuery = view === "month" ? month : agenda;
  const requestedEventId = params.get("event");
  useEffect(() => {
    if (!requestedEventId || selectedEvent) return;
    const event = [...agendaEvents, ...monthEvents].find((item) => item.id === requestedEventId);
    if (event) setSelectedEvent(event);
  }, [agendaEvents, monthEvents, requestedEventId, selectedEvent]);

  return (
    <main className="calendar-page">
      <header className="calendar-heading">
        <div>
          <p>Personal schedule</p>
          <h1>Calendar</h1>
          <span>One calm view of your plans, challenges, and competitive commitments.</span>
        </div>
        <Button onClick={() => setComposerOpen(true)}>
          <Plus size={16} />
          Add event
        </Button>
      </header>
      <section className="calendar-commandbar">
        <div className="calendar-view-switch" aria-label="Calendar view">
          <button
            type="button"
            aria-pressed={view === "agenda"}
            onClick={() => change("view", undefined)}
          >
            <List size={15} />
            Agenda
          </button>
          <button
            type="button"
            aria-pressed={view === "month"}
            onClick={() => change("view", "month")}
          >
            <CalendarDays size={15} />
            Month
          </button>
        </div>
        {view === "agenda" ? (
          <div className="calendar-period-switch" aria-label="Agenda period">
            <button
              type="button"
              aria-pressed={period === "upcoming"}
              onClick={() => change("period", undefined)}
            >
              Upcoming
            </button>
            <button
              type="button"
              aria-pressed={period === "past"}
              onClick={() => change("period", "past")}
            >
              Past
            </button>
          </div>
        ) : (
          <div className="calendar-month-nav">
            <button
              type="button"
              onClick={() => selectMonth(shiftMonth(activeMonth, -1))}
              aria-label="Previous month"
            >
              <ChevronLeft size={17} />
            </button>
            <button
              type="button"
              onClick={() =>
                selectMonth(monthKey(new Date(), timeZone), dayKey(new Date(), timeZone))
              }
            >
              Today
            </button>
            <strong>
              {new Date(`${activeMonth}-02T12:00:00Z`).toLocaleDateString(undefined, {
                month: "long",
                year: "numeric",
                timeZone,
              })}
            </strong>
            <button
              type="button"
              onClick={() => selectMonth(shiftMonth(activeMonth, 1))}
              aria-label="Next month"
            >
              <ChevronRight size={17} />
            </button>
          </div>
        )}
      </section>
      <section className="calendar-toolbar">
        <div className="calendar-search">
          <Search size={16} />
          <label>
            <span className="sr-only">Search calendar</span>
            <input
              value={search}
              onChange={(event) => change("q", event.target.value || undefined)}
              placeholder="Search events, games, or notes"
            />
          </label>
          {search !== debouncedSearch ? <i aria-label="Searching" /> : null}
          <button
            type="button"
            aria-expanded={filtersOpen}
            onClick={() => setFiltersOpen((open) => !open)}
          >
            <SlidersHorizontal size={15} />
            <span>Filters</span>
            {applied ? <b>{applied}</b> : null}
            <ChevronDown size={14} />
          </button>
        </div>
        <div className="calendar-filters" hidden={!filtersOpen}>
          <label>
            <span>Source</span>
            <select
              value={source || ""}
              onChange={(event) => change("source", event.target.value || undefined)}
            >
              <option value="">All sources</option>
              <option value="manual">Personal</option>
              <option value="challenge">Challenges</option>
              <option value="tournament">Tournaments</option>
            </select>
          </label>
          <label>
            <span>Type</span>
            <select
              value={type || ""}
              onChange={(event) => change("type", event.target.value || undefined)}
            >
              <option value="">All event types</option>
              <option value="match">Matches</option>
              <option value="practice">Practice</option>
              <option value="team_meeting">Team meetings</option>
              <option value="personal">Personal</option>
              <option value="tournament">Tournaments</option>
            </select>
          </label>
          <label>
            <span>Status</span>
            <select
              value={status || ""}
              onChange={(event) => change("status", event.target.value || undefined)}
            >
              <option value="">Any status</option>
              <option value="pending">Awaiting response</option>
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">In progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>
          <SearchSelect
            label="Game"
            value={game || ""}
            onChange={(value) => change("game", value || undefined)}
            onSearch={setGameSearch}
            options={gameOptions}
            loading={gameQuery.isLoading}
            loadingMore={gameQuery.isFetchingNextPage}
            hasMore={gameQuery.hasNextPage}
            onLoadMore={() => {
              if (!gameQuery.isFetchingNextPage) void gameQuery.fetchNextPage();
            }}
            placeholder="Any game"
            searchPlaceholder="Search games"
          />
          {applied || search ? (
            <button type="button" onClick={resetFilters}>
              <RotateCcw size={14} />
              Reset
            </button>
          ) : null}
        </div>
      </section>
      <div className="calendar-result-context">
        <span>
          {view === "month"
            ? `${month.data?.pages[0]?.total ?? 0} events this month`
            : period === "past"
              ? "Recent history"
              : "Your next commitments"}
        </span>
        <small>
          {view === "month" && month.isFetchingNextPage
            ? "Loading the full month…"
            : timeZone.split("_").join(" ")}
        </small>
      </div>
      {visibleQuery.isLoading ? (
        <CalendarSkeleton month={view === "month"} />
      ) : visibleQuery.isError ? (
        <StatePanel
          tone="error"
          title="Your calendar could not load"
          description={getApiErrorMessage(
            visibleQuery.error,
            "Gamerie could not retrieve your schedule right now.",
          )}
          action={
            <Button variant="secondary" onClick={() => visibleQuery.refetch()}>
              Try again
            </Button>
          }
        />
      ) : view === "month" ? (
        <div className="calendar-month-layout">
          <CalendarMonth
            events={monthEvents}
            month={activeMonth}
            selectedDay={selectedDay}
            timeZone={timeZone}
            onOpenEvent={setSelectedEvent}
            onSelectDay={(day) => change("day", day)}
          />
          <aside className="calendar-day-panel">
            <header>
              <span>
                {new Date(`${selectedDay}T12:00:00Z`).toLocaleDateString(undefined, {
                  weekday: "long",
                })}
              </span>
              <strong>
                {new Date(`${selectedDay}T12:00:00Z`).toLocaleDateString(undefined, {
                  day: "numeric",
                  month: "long",
                })}
              </strong>
            </header>
            {selectedEvents.length ? (
              <div>
                {selectedEvents.map((event) => (
                  <CalendarEventRow
                    key={event.id}
                    event={event}
                    timeZone={timeZone}
                    onOpen={() => setSelectedEvent(event)}
                  />
                ))}
              </div>
            ) : (
              <p>
                No events on this day.
                <button type="button" onClick={() => setComposerOpen(true)}>
                  Add one
                </button>
              </p>
            )}
          </aside>
        </div>
      ) : agendaEvents.length ? (
        <div className="calendar-agenda">
          {Object.entries(groups).map(([date, events]) => (
            <section key={date}>
              <header>
                <time dateTime={date}>
                  <strong>
                    {new Date(`${date}T12:00:00Z`).toLocaleDateString(undefined, {
                      weekday: "long",
                    })}
                  </strong>
                  <span>
                    {new Date(`${date}T12:00:00Z`).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "long",
                      year:
                        date.slice(0, 4) === String(new Date().getFullYear())
                          ? undefined
                          : "numeric",
                    })}
                  </span>
                </time>
                <small>
                  {events.length} {events.length === 1 ? "event" : "events"}
                </small>
              </header>
              <div>
                {events.map((event) => (
                  <CalendarEventRow
                    key={event.id}
                    event={event}
                    timeZone={timeZone}
                    onOpen={() => setSelectedEvent(event)}
                  />
                ))}
              </div>
            </section>
          ))}
          <InfiniteLoadTrigger
            fetching={agenda.isFetchingNextPage}
            hasMore={Boolean(agenda.hasNextPage)}
            label="Load more events"
            onLoad={() => {
              if (!agenda.isFetchingNextPage) void agenda.fetchNextPage();
            }}
          />
        </div>
      ) : (
        <StatePanel
          icon={<CalendarDays size={20} />}
          title={period === "past" ? "No past events in this view" : "Your schedule is clear"}
          description={
            period === "past"
              ? "Completed and cancelled events will remain available here."
              : "Add a personal event, or accept a challenge, and it will appear in your calendar."
          }
          action={
            period === "past" ? (
              <Button variant="quiet" onClick={() => change("period", undefined)}>
                View upcoming
              </Button>
            ) : (
              <Button onClick={() => setComposerOpen(true)}>
                <Plus size={15} />
                Add your first event
              </Button>
            )
          }
        />
      )}
      {composerOpen && user?.id ? (
        <CalendarComposer
          currentUserId={user.id}
          defaultTimeZone={timeZone}
          onClose={() => setComposerOpen(false)}
        />
      ) : null}
      {selectedEvent ? (
        <CalendarEventDetail
          event={selectedEvent}
          timeZone={timeZone}
          onClose={() => setSelectedEvent(null)}
        />
      ) : null}
    </main>
  );
}
