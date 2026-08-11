import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAdminUsers, setAdminUserBan } from "./api";
import type { AdminUserQuery } from "./types";

export function useAdminUsers(query: AdminUserQuery) {
  return useQuery({
    queryKey: ["admin", "users", query],
    queryFn: () => getAdminUsers(query),
    placeholderData: keepPreviousData,
  });
}

export function useSetAdminUserBan() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ban, reason }: { id: string; ban: boolean; reason: string }) =>
      setAdminUserBan(id, ban, reason),
    onSuccess: () => client.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}
