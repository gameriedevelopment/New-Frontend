export type TournamentStatus = "active" | "upcoming" | "ongoing" | "completed";

export interface Tournament {
  id: string;
  platform: string;
  platformUrl?: string | null;
  game: string;
  name: string;
  description?: string | null;
  startDate: string;
  endDate: string;
  prizePool?: number | null;
  registrationDeadline?: string | null;
  format?: string | null;
  teamSize?: number | null;
  currentTeams?: number | null;
  maxTeams?: number | null;
  region?: string | null;
  organizer?: string | null;
  totalParticipants?: number | null;
  skillLevel?: string | null;
  status?: Exclude<TournamentStatus, "active">;
  image?: string | null;
}

export interface TournamentFilters {
  search?: string;
  game?: string;
  platform?: string;
  region?: string;
  skillLevel?: string;
  prizeMin?: number;
  teamSize?: number;
  status: TournamentStatus;
}

export interface TournamentPageData {
  tournaments: Tournament[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface TournamentFacets {
  platforms: string[];
  regions: string[];
  skillLevels: string[];
  teamSizes: number[];
}

export type RegistrationState = "open" | "closing" | "full" | "closed" | "started" | "completed";

export interface TournamentTiming {
  lifecycle: "upcoming" | "ongoing" | "completed";
  registration: RegistrationState;
  registrationLabel: string;
}
