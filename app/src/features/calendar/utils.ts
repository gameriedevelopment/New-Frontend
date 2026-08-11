import type { CalendarEvent, CalendarEventSource, CalendarEventStatus } from "./types";

export const eventTypeLabels: Record<string, string> = {
  match: "Match",
  practice: "Practice",
  training: "Practice",
  team_meeting: "Team meeting",
  meeting: "Team meeting",
  personal: "Personal",
  tournament: "Tournament",
};

export const sourceLabels: Record<CalendarEventSource, string> = {
  manual: "Personal",
  challenge: "Challenge",
  tournament: "Tournament",
};

export const statusLabels: Record<CalendarEventStatus, string> = {
  pending: "Awaiting response",
  upcoming: "Upcoming",
  ongoing: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

function partsAt(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

export function zonedDateTimeToIso(value: string, timeZone: string): string {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) throw new Error("Invalid local date and time");
  const target = Date.UTC(+match[1], +match[2] - 1, +match[3], +match[4], +match[5]);
  let instant = target;
  for (let pass = 0; pass < 3; pass += 1) {
    const actual = partsAt(new Date(instant), timeZone);
    const represented = Date.UTC(
      +actual.year,
      +actual.month - 1,
      +actual.day,
      +actual.hour,
      +actual.minute,
      +actual.second,
    );
    instant += target - represented;
  }
  const resolved = partsAt(new Date(instant), timeZone);
  const resolvedWall = `${resolved.year}-${resolved.month}-${resolved.day}T${resolved.hour}:${resolved.minute}`;
  if (resolvedWall !== value)
    throw new Error("This local time does not exist in the selected timezone");
  return new Date(instant).toISOString();
}

export function monthKey(
  date = new Date(),
  timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone,
): string {
  const parts = partsAt(date, timeZone);
  return `${parts.year}-${parts.month}`;
}

export function shiftMonth(month: string, amount: number): string {
  const [year, value] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, value - 1 + amount, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function monthRange(month: string, timeZone: string) {
  const next = shiftMonth(month, 1);
  return {
    startDate: zonedDateTimeToIso(`${month}-01T00:00`, timeZone),
    endDate: new Date(
      new Date(zonedDateTimeToIso(`${next}-01T00:00`, timeZone)).getTime() - 1,
    ).toISOString(),
  };
}

export function dayKey(date: Date | string, timeZone: string): string {
  const parts = partsAt(new Date(date), timeZone);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function monthCells(month: string): string[] {
  const [year, value] = month.split("-").map(Number);
  const first = new Date(Date.UTC(year, value - 1, 1));
  const mondayOffset = (first.getUTCDay() + 6) % 7;
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(Date.UTC(year, value - 1, index - mondayOffset + 1));
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
  });
}

export function formatEventTime(event: CalendarEvent, timeZone: string): string {
  const start = new Date(event.startTime);
  const end = new Date(event.endTime);
  const sameDay = dayKey(start, timeZone) === dayKey(end, timeZone);
  const date = new Intl.DateTimeFormat(undefined, {
    timeZone,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(start);
  const time = new Intl.DateTimeFormat(undefined, { timeZone, hour: "numeric", minute: "2-digit" });
  return sameDay
    ? `${date} · ${time.format(start)}–${time.format(end)}`
    : `${date} · ${time.format(start)}`;
}

export function eventContextPath(event: CalendarEvent): string | undefined {
  if (event.sourceType === "challenge" && (event.sourceId || event.challengeId))
    return `/challenges/${event.sourceId || event.challengeId}`;
  if (event.sourceType === "tournament") return "/tournaments";
  return undefined;
}
