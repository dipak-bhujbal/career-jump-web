import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type ConfigEnvelope, type RegistryEntry, type RegistryMeta, type CompanyConfig } from "@/lib/api";
import registryData, { REGISTRY_META } from "@/data/companies-registry";

function localRegistrySearch(q: { search?: string; ats?: string; tier?: string }): { ok: boolean; total: number; entries: RegistryEntry[] } {
  let entries: RegistryEntry[] = registryData.map((c, i) => ({
    rank: i + 1,
    sheet: "Registry",
    company: c.company,
    board_url: c.board_url,
    ats: c.ats,
    total_jobs: null,
    source: "registry",
    tier: c.tier as RegistryEntry["tier"],
  }));
  if (q.ats) entries = entries.filter((e) => (e.ats ?? "").toLowerCase() === q.ats!.toLowerCase());
  if (q.tier) entries = entries.filter((e) => e.tier === q.tier);
  if (q.search) entries = entries.filter((e) => e.company.toLowerCase().includes(q.search!.toLowerCase()));
  return { ok: true, total: entries.length, entries: entries.slice(0, 50) };
}

function localRegistryMeta(): RegistryMeta {
  return {
    ok: true,
    meta: { version: REGISTRY_META.version, total: REGISTRY_META.total },
    loadedAt: Date.now(),
    adapters: [...REGISTRY_META.adapters],
    counts: {
      total: REGISTRY_META.total,
      tier1: REGISTRY_META.tier1,
      tier2: REGISTRY_META.tier2,
      tier3: REGISTRY_META.tier3,
      needsReview: REGISTRY_META.needsReview,
    },
  };
}

export const configKey = ["config"] as const;
export const registryMetaKey = ["registry", "meta"] as const;
export const registrySearchKey = (q: { search?: string; ats?: string; tier?: string }) =>
  ["registry", "search", q.search ?? "", q.ats ?? "", q.tier ?? ""] as const;

export function useConfig() {
  return useQuery({
    queryKey: configKey,
    queryFn: () => api.get<ConfigEnvelope>("/api/config"),
    staleTime: 30_000,
  });
}

export function useRegistryMeta() {
  return useQuery({
    queryKey: registryMetaKey,
    queryFn: async () => {
      try {
        const result = await api.get<RegistryMeta>("/api/registry/meta");
        // Fall back to bundled data if API returns an empty registry.
        if ((result.counts?.total ?? 0) === 0) return localRegistryMeta();
        return result;
      } catch {
        return localRegistryMeta();
      }
    },
    staleTime: 5 * 60_000,
  });
}

export function useRegistrySearch(q: { search?: string; ats?: string; tier?: string; enabled?: boolean }) {
  return useQuery({
    queryKey: registrySearchKey(q),
    queryFn: async () => {
      try {
        const p = new URLSearchParams();
        if (q.search) p.set("search", q.search);
        if (q.ats) p.set("ats", q.ats);
        if (q.tier) p.set("tier", q.tier);
        p.set("limit", "50");
        const result = await api.get<{ ok: boolean; total: number; entries: RegistryEntry[] }>(`/api/registry/companies?${p.toString()}`);
        // Fall back to bundled data if the API returns empty results.
        if (result.total === 0 && result.entries.length === 0) return localRegistrySearch(q);
        return result;
      } catch {
        return localRegistrySearch(q);
      }
    },
    enabled: q.enabled !== false,
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
}

export function useSaveConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { companies: CompanyConfig[]; jobtitles: { includeKeywords: string[]; excludeKeywords: string[] } }) =>
      api.post<{ ok: boolean; config: unknown }>("/api/config/save", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: configKey }),
  });
}

export function useToggleCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ company, paused }: { company: string; paused: boolean }) =>
      api.post<{ ok: boolean; companyScanOverrides?: Record<string, unknown> }>(
        `/api/companies/${encodeURIComponent(company)}/toggle`,
        { paused },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: configKey }),
  });
}
