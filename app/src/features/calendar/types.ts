export type CalendarEventType = "match" | "practice" | "team_meeting" | "personal" | "tournament";
export type CalendarEventStatus = "pending" | "upcoming" | "ongoing" | "completed" | "cancelled";
export type CalendarEventSource = "manual" | "challenge" | "tournament";

export interface CalendarEvent {
  id: string;
  type: CalendarEventType | string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  game?: string;
  team?: string;
  location?: string;
  status: CalendarEventStatus;
  sourceType: CalendarEventSource;
  sourceId?: string;
  challengeId?: string;
  createdBy: string;
  cancelledAt?: string;
  reminders?: Array<{ id?: string; time: string; method: "notification"; sentAt?: string }>;
  recurrence?: {
    frequency: "none" | "daily" | "weekly" | "monthly";
    interval?: number;
    until?: string;
  };
}

export interface CalendarFilters {
  searchTerm?: string;
  type?: string;
  status?: string;
  game?: string;
  sourceType?: CalendarEventSource;
  startDate?: string;
  endDate?: string;
  order?: "asc" | "desc";
}

export interface CalendarPageData {
  events: CalendarEvent[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateCalendarEventPayload {
  type: Exclude<CalendarEventType, "tournament">;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  game?: string;
  team?: string;
  location?: string;
  status: "upcoming";
  reminders?: Array<{ time: string; method: "notification" }>;
}
