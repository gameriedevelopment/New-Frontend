import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAnnouncements, publishAnnouncement, runBrevoResync } from "./api";

export function useAnnouncements() {
  return useInfiniteQuery({
    queryKey: ["admin", "communications", "announcements"],
    queryFn: ({ pageParam }) => getAnnouncements(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function usePublishAnnouncement() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ content, reason }: { content: string; reason: string }) =>
      publishAnnouncement(content, reason),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: ["admin", "communications", "announcements"] }),
  });
}

export function useBrevoResync() {
  return useMutation({ mutationFn: runBrevoResync });
}
