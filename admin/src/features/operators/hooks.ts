import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  acceptAdminInvite,
  getAdminInviteDetails,
  getPlatformAdminInvites,
  getPlatformAdmins,
  invitePlatformAdmin,
  removePlatformAdmin,
  resendPlatformAdminInvite,
  revokePlatformAdminInvite,
  updatePlatformAdmin,
} from "./api";
import type { PlatformAdminMember, PlatformAdminQuery } from "./types";

export function usePlatformAdmins(query: PlatformAdminQuery, enabled = true) {
  return useQuery({
    queryKey: ["admin", "operators", query],
    queryFn: () => getPlatformAdmins(query),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function usePlatformAdminInvites(query: PlatformAdminQuery, enabled = true) {
  return useQuery({
    queryKey: ["admin", "operator-invites", query],
    queryFn: () => getPlatformAdminInvites(query),
    placeholderData: keepPreviousData,
    enabled,
  });
}

function useOperatorMutation<T>(mutationFn: (input: T) => Promise<unknown>) {
  const client = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => client.invalidateQueries({ queryKey: ["admin"] }),
  });
}

export function useInvitePlatformAdmin() {
  return useOperatorMutation((email: string) => invitePlatformAdmin(email));
}

export function useUpdatePlatformAdmin() {
  return useOperatorMutation(
    (input: { id: string; status: PlatformAdminMember["status"]; reason: string }) =>
      updatePlatformAdmin(input.id, input.status, input.reason),
  );
}

export function useRemovePlatformAdmin() {
  return useOperatorMutation((input: { id: string; reason: string }) =>
    removePlatformAdmin(input.id, input.reason),
  );
}

export function useResendPlatformAdminInvite() {
  return useOperatorMutation((id: string) => resendPlatformAdminInvite(id));
}

export function useRevokePlatformAdminInvite() {
  return useOperatorMutation((id: string) => revokePlatformAdminInvite(id));
}

export function useAdminInviteDetails(token: string) {
  return useQuery({
    queryKey: ["admin-invite", token],
    queryFn: () => getAdminInviteDetails(token),
    enabled: Boolean(token),
    retry: false,
  });
}

export function useAcceptAdminInvite() {
  return useMutation({ mutationFn: acceptAdminInvite });
}
