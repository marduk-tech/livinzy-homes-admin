import { scriptServerApiInstance } from "../script-server-axios-instance";

// Mirrors stagehand/src/portal-gateway (routes.ts, gateway.ts, identity/store.ts)

// Health is per (proxy, portal): a block on one broker doesn't bench the proxy for the others.
export type HealthStatus = "fresh" | "active" | "cooldown" | "retired";

export type ProxyHealth = {
  portal: string;
  status: HealthStatus;
  strikes: number;
  cooldownUntil: string | null;
  goodFetches: number;
  blockedFetches: number;
  mintFailures: number;
  transportErrors: number;
  lastError: string | null;
  lastUsedAt: string | null;
  cooldownRemainingMs: number;
  eligible: boolean;
};

export type PortalProxy = {
  id: string;
  proxy: string;
  label: string | null;
  tag: string | null;
  exitIp: string | null;
  exitCountry?: string | null;
  portals: string[];
  source: "config" | "ui";
  disabled: boolean;
  // proxy-level only, e.g. a failed manager test
  lastError: string | null;
  createdAt: string;
  profiles: { portal: string; id: string; generation: number; mints: number }[];
  // one entry per tagged portal
  health: ProxyHealth[];
  // leasable by at least one tagged portal
  eligible: boolean;
};

export type PortalProfile = {
  id: string;
  portal: string;
  name: string;
  fingerprintSeed: number | null;
  generation: number;
  status: "active" | "retired";
  mints: number;
  lastMintedAt: string | null;
  lastError: string | null;
  createdAt: string;
  retiredAt: string | null;
};

// orphan: no store row · retired: store row retired · proxy-*: its proxy is disabled / retired for that portal
export type AbandonedReason = "orphan" | "retired" | "proxy-disabled" | "proxy-retired";

export type AbandonedProfile = {
  id: string;
  name: string;
  portal: string | null;
  status: string;
  reason: AbandonedReason;
  proxyId: string | null;
  proxy: string | null;
  createdAt: string | null;
  retiredAt: string | null;
};

export type PoolIdentity = {
  label: string;
  proxy: string;
  proxyId: string;
  profileId: string;
  uses: number;
  ageMs: number | null;
  warm: boolean;
  leased: boolean;
  mintedAt: number | null;
  lastHealthyAt: number | null;
  nextCheckInMs: number | null;
  lastCheck: { at: number; ok: boolean; detail?: string } | null;
};

export type PortalStatus = {
  id: string;
  enabled: boolean;
  needsIdentity: boolean;
  structured: boolean;
  minWarm: number;
  // warmer keeps this many ready and never mints past it
  warmTarget: number;
  health: { enabled: boolean; intervalMs: number };
  resultQuota: number;
  // search query templates the pipeline runs for this broker
  queries: string[];
  hasParser: boolean;
  templateProfileId: string | null;
  pool: {
    warm: number;
    leased: number;
    minting: number;
    eligibleProxies: number;
    identities: PoolIdentity[];
  } | null;
  blockRate: number;
  breakerOpenForMs: number;
  warmer: { failures: number; nextTryInMs: number; lastError: string | null };
  // missing on script servers from before per-portal health
  proxies?: Record<
    "tagged" | "eligible" | "fresh" | "active" | "cooldown" | "retired",
    number
  >;
  last24h: {
    total: number;
    cacheHitRate: number;
    byStatus: Record<string, number>;
  };
};

export type GatewayStatus = {
  enabled: boolean;
  managerConfigured: boolean;
  templateProfileId: string | null;
  portals: PortalStatus[];
  proxies: Record<"all" | "eligible" | "disabled", number>;
};

export type ScrapeLogRow = {
  id: number;
  at: string;
  url: string;
  portal: string | null;
  kind: string | null;
  status: string;
  identity: string | null;
  ms: number;
  cached: boolean;
  error: string | null;
};

export type ScrapeResult = {
  url: string;
  portal: string | null;
  kind: string;
  status: string;
  markdown?: string;
  data?: unknown;
  html?: string;
  cached: boolean;
  fetchedAt: string;
  ms: number;
  error?: string;
};

export type ConfigSource = "default" | "file" | "env" | "override";

export type FieldHint = {
  type: "number" | "boolean" | "string" | "number[]" | "list";
  nullable: boolean;
};

export type GatewayConfig = {
  config: Record<string, unknown>;
  sources: Record<string, ConfigSource>;
  restartOnly: string[];
  // leaf types from the server schema, keyed by dotted path
  fields?: Record<string, FieldHint>;
};

export type AddProxiesResult = {
  added: number;
  duplicates: { url: string; reason: string }[];
  invalid: { url: string; reason: string }[];
  warnings: { url: string; reason: string }[];
  unreachable: { url: string; reason: string }[];
};

const api = scriptServerApiInstance;

export async function getGatewayStatus(): Promise<GatewayStatus> {
  const { data } = await api.get<GatewayStatus>("/portal/status");
  return data;
}

export async function getProxies(): Promise<{
  proxies: PortalProxy[];
  tags: string[];
  eligible: number;
}> {
  const { data } = await api.get("/portal/proxies");
  return data;
}

export async function getProxyProfiles(id: string): Promise<PortalProfile[]> {
  const { data } = await api.get<{ profiles: PortalProfile[] }>(
    `/portal/proxies/${id}/profiles`,
  );
  return data.profiles;
}

export async function addProxies(payload: {
  urls: string[];
  tag?: string;
  test?: boolean;
  portals?: string[];
}): Promise<AddProxiesResult> {
  const { data } = await api.post("/portal/proxies", payload);
  return data;
}

// reset with a portal clears only that broker's strikes
export async function proxyAction({
  id,
  action,
  portal,
}: {
  id: string;
  action: "disable" | "enable" | "reset" | "test";
  portal?: string;
}): Promise<{ ok: boolean }> {
  const { data } = await api.post(
    `/portal/proxies/${id}/${action}`,
    undefined,
    { params: portal ? { portal } : undefined },
  );
  return data;
}

export async function setProxyPortals({
  id,
  portals,
}: {
  id: string;
  portals: string[];
}) {
  const { data } = await api.post(`/portal/proxies/${id}/portals`, { portals });
  return data;
}

export async function deleteProxies(
  ids: string[],
): Promise<{ deleted: number }> {
  const { data } = await api.post("/portal/proxies/delete", { ids });
  return data;
}

export async function bulkProxyAction({
  ids,
  action,
}: {
  ids: string[];
  action: "disable" | "enable";
}) {
  const { data } = await api.post(`/portal/proxies/bulk/${action}`, { ids });
  return data;
}

export async function getScrapes(filters: {
  limit?: number;
  portal?: string;
  status?: string;
}): Promise<ScrapeLogRow[]> {
  const { data } = await api.get<{ scrapes: ScrapeLogRow[] }>(
    "/portal/scrapes",
    { params: filters },
  );
  return data.scrapes;
}

export async function scrapeUrl(payload: {
  url: string;
  mode?: "auto" | "html" | "structured";
  noCache?: boolean;
}): Promise<ScrapeResult> {
  // Minting isn't on this path, but a cold identity pool can still make it wait
  const { data } = await api.post<ScrapeResult>("/portal/scrape", payload, {
    timeout: 120_000,
  });
  return data;
}

export async function getGatewayConfig(): Promise<GatewayConfig> {
  const { data } = await api.get<GatewayConfig>("/portal/config");
  return data;
}

export async function patchGatewayConfig(
  patch: Record<string, unknown>,
): Promise<GatewayConfig> {
  const { data } = await api.patch<GatewayConfig>("/portal/config", patch);
  return data;
}

export async function clearConfigOverride(
  path: string,
): Promise<{ ok: boolean }> {
  const { data } = await api.delete("/portal/config/override", {
    params: { path },
  });
  return data;
}

export async function clearScrapeCache(
  url?: string,
): Promise<{ cleared: number }> {
  const { data } = await api.post("/portal/cache/clear", url ? { url } : {});
  return data;
}

// Starts a mint in the background (takes 30-120s); watch "minting" in the status.
export async function mintBroker({
  portal,
  proxyId,
}: {
  portal: string;
  proxyId?: string;
}) {
  const { data } = await api.post<{ proxyId: string; label: string }>(
    `/portal/brokers/${portal}/mint`,
    { proxyId },
  );
  return data;
}

export async function retireIdentity({
  portal,
  proxyId,
}: {
  portal: string;
  proxyId: string;
}) {
  const { data } = await api.post(
    `/portal/brokers/${portal}/identities/${proxyId}/retire`,
  );
  return data;
}

export async function runHealthCheck({ portal }: { portal: string }) {
  const { data } = await api.post<{ checked: number; failed: number }>(
    `/portal/brokers/${portal}/health-check`,
    undefined,
    {
      timeout: 120_000,
    },
  );
  return data;
}

// Gateway-owned profiles on the browser manager that nothing uses any more.
export async function getAbandonedProfiles(): Promise<{ profiles: AbandonedProfile[]; total: number }> {
  const { data } = await api.get("/portal/profiles/abandoned", { timeout: 60_000 });
  return data;
}

// Irreversible: the manager removes each profile's user-data dir too.
export async function deleteManagerProfiles(
  ids: string[],
): Promise<{ deleted: number; skipped: number; failed: { id: string; error: string }[] }> {
  const { data } = await api.post("/portal/profiles/delete", { ids }, { timeout: 300_000 });
  return data;
}
