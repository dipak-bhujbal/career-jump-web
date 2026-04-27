/**
 * Hooks for the long-running scan ("run") workflow.
 *
 * `useRunStatus` polls /api/run/status every 2 seconds while a scan is
 * active so the progress monitor in the sidebar updates in near real
 * time, and pauses polling when no run is in flight.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type RunStatus } from "@/lib/api";

export const runStatusKey = ["run", "status"] as const;

export function useRunStatus() {
  return useQuery({
    queryKey: runStatusKey,
    queryFn: () => api.get<RunStatus>("/api/run/status"),
    refetchInterval: (q) => (q.state.data?.active ? 2000 : 30_000),
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
}

export function useStartRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<RunStatus>("/api/run"),
    onSuccess: () => qc.invalidateQueries({ queryKey: runStatusKey }),
  });
}

export function useAbortRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<{ ok: boolean }>("/api/run/abort"),
    onSuccess: () => qc.invalidateQueries({ queryKey: runStatusKey }),
  });
}

export function useClearCache() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<{ ok: boolean }>("/api/cache/clear"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useResetData() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<{ ok: boolean }>("/api/data/clear"),
    onSuccess: () => {
      // Clear-data mutates every dashboard-backed collection, so refresh the
      // full surface area that can still show stale counts after the reset.
      qc.invalidateQueries({ queryKey: ["jobs"] });
      qc.invalidateQueries({ queryKey: ["applied"] });
      qc.invalidateQueries({ queryKey: ["actionPlan"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["logs"] });
    },
  });
}

export function useRemoveBrokenLinks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<{ ok: boolean; removed?: number }>("/api/jobs/remove-broken-links"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}

export function useToggleAllCompanies() {
  return useMutation({
    mutationFn: (paused: boolean) => api.post<{ ok: boolean }>("/api/companies/toggle-all", { paused }),
  });
}
