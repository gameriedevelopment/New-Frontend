import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { connectProvider, disconnectProvider, getGameConnections, getProviderMetrics, type ProviderConnectPayload } from "./api";
import type { GameConnection, GameProviderId } from "../types";

export function useGameConnections(enabled = true) {
  return useQuery({ queryKey: ["game-connections"], queryFn: getGameConnections, enabled, staleTime: 60_000 });
}
export function useConnectProvider() {
  const client = useQueryClient();
  return useMutation({ mutationFn: ({ provider, payload }: { provider: GameProviderId; payload: ProviderConnectPayload }) => connectProvider(provider, payload), onSuccess: () => client.invalidateQueries({ queryKey: ["game-connections"] }) });
}
export function useDisconnectProvider() {
  const client = useQueryClient();
  return useMutation({ mutationFn: disconnectProvider, onSuccess: () => client.invalidateQueries({ queryKey: ["game-connections"] }) });
}
export function useProviderMetrics(connection?: GameConnection, enabled = true) {
  return useQuery({ queryKey: ["game-connections", connection?.provider, connection?.providerAccountId, "stats"], queryFn: () => getProviderMetrics(connection!), enabled: Boolean(connection) && enabled, staleTime: 2 * 60_000, retry: 1 });
}
