import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createCalendarEvent, getMyEvents, updateCalendarEventStatus } from "./api";
import type { CalendarEventStatus, CalendarFilters, CreateCalendarEventPayload } from "./types";

export function useCalendarAgenda(filters: CalendarFilters, enabled = true) {
  return useInfiniteQuery({
    queryKey: ["calendar-events", "agenda", filters],
    queryFn: ({ pageParam }) => getMyEvents(filters, pageParam, 20),
    initialPageParam: 1,
    getNextPageParam: (page) => (page.page < page.totalPages ? page.page + 1 : undefined),
    staleTime: 30_000,
    enabled,
  });
}

export function useCalendarMonth(filters: CalendarFilters, enabled = true) {
  return useInfiniteQuery({
    queryKey: ["calendar-events", "month", filters],
    queryFn: ({ pageParam }) => getMyEvents(filters, pageParam, 100),
    initialPageParam: 1,
    getNextPageParam: (page) => (page.page < page.totalPages ? page.page + 1 : undefined),
    staleTime: 30_000,
    enabled,
  });
}

function reconcile(client: ReturnType<typeof useQueryClient>) {
  void client.invalidateQueries({ queryKey: ["calendar-events"] });
  void client.invalidateQueries({ queryKey: ["user-events"] });
}

export function useCreateCalendarEvent() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCalendarEventPayload) => createCalendarEvent(payload),
    onSuccess: () => reconcile(client),
  });
}

export function useUpdateCalendarEventStatus() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: CalendarEventStatus }) =>
      updateCalendarEventStatus(id, status),
    onSuccess: () => reconcile(client),
  });
}
