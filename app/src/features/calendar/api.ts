import { api } from "../../lib/api";
import type {
  CalendarEvent,
  CalendarEventStatus,
  CalendarFilters,
  CalendarPageData,
  CreateCalendarEventPayload,
} from "./types";

interface Envelope<T> {
  data: T;
}

export async function getMyEvents(
  filters: CalendarFilters,
  page = 1,
  limit = 20,
): Promise<CalendarPageData> {
  const { data } = await api.get<Envelope<{ events: CalendarEvent[]; total: number }>>(
    "/events/mine",
    {
      params: { ...filters, page, limit },
    },
  );
  const total = Number(data.data.total ?? 0);
  return {
    events: data.data.events ?? [],
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function createCalendarEvent(
  payload: CreateCalendarEventPayload,
): Promise<CalendarEvent> {
  const { data } = await api.post<Envelope<CalendarEvent>>("/events", payload);
  return data.data;
}

export async function updateCalendarEventStatus(
  id: string,
  status: CalendarEventStatus,
): Promise<CalendarEvent> {
  const { data } = await api.patch<Envelope<CalendarEvent>>(`/events/${id}/status`, { status });
  return data.data;
}
