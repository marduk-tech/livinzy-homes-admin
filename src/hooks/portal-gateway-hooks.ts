import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notification } from "antd";
import { errorMessage } from "../libs/api-error";
import {
  addProxies,
  bulkProxyAction,
  clearConfigOverride,
  clearScrapeCache,
  deleteProxies,
  getGatewayConfig,
  getGatewayStatus,
  getProxies,
  getProxyProfiles,
  getScrapes,
  mintBroker,
  patchGatewayConfig,
  retireIdentity,
  runHealthCheck,
  proxyAction,
  scrapeUrl,
  setProxyPortals,
} from "../libs/api/portal-gateway";
import { queryKeys } from "../libs/constants";

export function useGatewayStatus() {
  return useQuery({
    queryKey: [queryKeys.portalStatus],
    queryFn: getGatewayStatus,
    refetchInterval: 5000,
  });
}

// Broker ids come from the server, so a newly registered broker needs no UI change.
export function usePortalIds(): string[] {
  const { data } = useGatewayStatus();
  return data?.portals.map((p) => p.id) ?? ["housing"];
}

export function usePortalProxies() {
  return useQuery({
    queryKey: [queryKeys.portalProxies],
    queryFn: getProxies,
    // cooldown countdowns and strike counts move on their own
    refetchInterval: 10000,
  });
}

export function useProxyProfiles(id?: string) {
  return useQuery({
    queryKey: [queryKeys.portalProfiles, id],
    queryFn: () => getProxyProfiles(id!),
    enabled: !!id,
  });
}

export function usePortalScrapes(filters: { limit?: number; portal?: string; status?: string }) {
  return useQuery({
    queryKey: [queryKeys.portalScrapes, filters],
    queryFn: () => getScrapes(filters),
    refetchInterval: 10000,
  });
}

export function useGatewayConfig() {
  return useQuery({ queryKey: [queryKeys.portalConfig], queryFn: getGatewayConfig });
}

// Every gateway mutation refreshes the same few views.
function useGatewayMutation<TArgs, TResult>(
  mutationFn: (args: TArgs) => Promise<TResult>,
  messages: { success?: string; error: string },
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      if (messages.success) notification.success({ message: messages.success });
    },
    onError: (error) => {
      notification.error({ message: messages.error, description: errorMessage(error, messages.error) });
    },
    onSettled: () => {
      for (const key of [queryKeys.portalProxies, queryKeys.portalStatus, queryKeys.portalConfig, queryKeys.portalScrapes]) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
    },
  });
}

export const useAddProxies = () => useGatewayMutation(addProxies, { error: "Could not add proxies" });

export const useProxyAction = () => useGatewayMutation(proxyAction, { error: "Proxy action failed" });

export const useSetProxyPortals = () =>
  useGatewayMutation(setProxyPortals, { success: "Portals updated", error: "Could not update portals" });

export const useDeleteProxies = () =>
  useGatewayMutation(deleteProxies, { success: "Proxies deleted", error: "Could not delete proxies" });

export const useBulkProxyAction = () => useGatewayMutation(bulkProxyAction, { error: "Bulk action failed" });

export const usePatchGatewayConfig = () =>
  useGatewayMutation(patchGatewayConfig, { success: "Config saved", error: "Could not save config" });

export const useClearConfigOverride = () =>
  useGatewayMutation(clearConfigOverride, { success: "Override removed", error: "Could not remove override" });

export const useClearScrapeCache = () =>
  useGatewayMutation(clearScrapeCache, { success: "Cache cleared", error: "Could not clear cache" });

export const useScrapeUrl = () => useGatewayMutation(scrapeUrl, { error: "Scrape failed" });

export const useMintBroker = () => useGatewayMutation(mintBroker, { error: "Could not start a mint" });

export const useRetireIdentity = () =>
  useGatewayMutation(retireIdentity, { success: "Session retired", error: "Could not retire session" });

export const useHealthCheck = () => useGatewayMutation(runHealthCheck, { error: "Health check failed" });
