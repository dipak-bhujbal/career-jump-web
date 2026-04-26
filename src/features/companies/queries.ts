import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type ConfigEnvelope, type RegistryEntry, type RegistryMeta, type CompanyConfig } from "@/lib/api";

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
    queryFn: () => api.get<RegistryMeta>("/api/registry/meta"),
    staleTime: 5 * 60_000,
  });
}

export function useRegistrySearch(q: { search?: string; ats?: string; tier?: string; enabled?: boolean }) {
  return useQuery({
    queryKey: registrySearchKey(q),
    queryFn: () => {
      const p = new URLSearchParams();
      if (q.search) p.set("search", q.search);
      if (q.ats) p.set("ats", q.ats);
      if (q.tier) p.set("tier", q.tier);
      p.set("limit", "50");
      return api.get<{ ok: boolean; total: number; entries: RegistryEntry[] }>(`/api/registry/companies?${p.toString()}`);
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
