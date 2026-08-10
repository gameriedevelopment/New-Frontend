export const TEAM_LEVELS = ["Hobbyist", "Amateur", "Advanced", "Competitor", "Pro"] as const;

export const COMMUNITY_REGIONS = [
  "Global",
  "Africa",
  "West Africa",
  "North Africa",
  "East Africa",
  "Central Africa",
  "Southern Africa",
  "Asia",
  "Middle East",
  "Europe",
  "North America",
  "South America",
  "Oceania",
] as const;

export interface TimezoneOption {
  value: string;
  label: string;
  offsetMinutes: number;
}

function timezoneOffsetMinutes(timeZone: string): number {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "shortOffset",
    }).formatToParts(new Date());
    const raw = parts.find((part) => part.type === "timeZoneName")?.value ?? "GMT";
    const match = raw.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
    if (!match) return 0;
    const sign = match[1] === "-" ? -1 : 1;
    return sign * (Number(match[2]) * 60 + Number(match[3] ?? 0));
  } catch {
    return 0;
  }
}

function formatOffset(offsetMinutes: number): string {
  if (offsetMinutes === 0) return "GMT";
  const sign = offsetMinutes > 0 ? "+" : "−";
  const absolute = Math.abs(offsetMinutes);
  const hours = Math.floor(absolute / 60);
  const minutes = absolute % 60;
  return minutes
    ? `GMT ${sign}${hours}:${String(minutes).padStart(2, "0")}`
    : `GMT ${sign}${hours}`;
}

let timezoneCache: TimezoneOption[] | undefined;

export function getTimezoneOptions(): TimezoneOption[] {
  if (timezoneCache) return timezoneCache;
  const intl = Intl as typeof Intl & { supportedValuesOf?: (key: "timeZone") => string[] };
  const supported = intl.supportedValuesOf?.("timeZone") ?? ["UTC"];
  const zones = supported.includes("UTC") ? supported : ["UTC", ...supported];
  timezoneCache = zones
    .map((zone) => {
      const offsetMinutes = timezoneOffsetMinutes(zone);
      return {
        value: zone,
        label: `${zone.replace(/_/g, " ")} (${formatOffset(offsetMinutes)})`,
        offsetMinutes,
      };
    })
    .sort((left, right) => {
      if (left.value === "UTC") return -1;
      if (right.value === "UTC") return 1;
      return left.label.localeCompare(right.label);
    });
  return timezoneCache;
}
