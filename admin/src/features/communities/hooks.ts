import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAdminHubs, getAdminTeams, setAdminHubBan, setAdminTeamBan } from "./api";
import type { AdminHubQuery, AdminTeamQuery } from "./types";

export function useAdminTeams(query: AdminTeamQuery) {
  return useQuery({
    queryKey: ["admin", "teams", query],
    queryFn: () => getAdminTeams(query),
    placeholderData: keepPreviousData,
  });
}

export function useAdminHubs(query: AdminHubQuery) {
  return useQuery({
    queryKey: ["admin", "hubs", query],
    queryFn: () => getAdminHubs(query),
    placeholderData: keepPreviousData,
  });
}

export function useSetAdminTeamBan() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ban, reason }: { id: string; ban: boolean; reason: string }) =>
      setAdminTeamBan(id, ban, reason),
    onSuccess: () => client.invalidateQueries({ queryKey: ["admin", "teams"] }),
  });
}

export function useSetAdminHubBan() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ban, reason }: { id: string; ban: boolean; reason: string }) =>
      setAdminHubBan(id, ban, reason),
    onSuccess: () => client.invalidateQueries({ queryKey: ["admin", "hubs"] }),
  });
}
