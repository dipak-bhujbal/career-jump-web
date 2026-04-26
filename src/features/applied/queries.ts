import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type AppliedJobsEnvelope, type AppliedStatus } from "@/lib/api";

export type AppliedFilter = {
  companies?: string[];
  /** Free-text search against job title (and company). */
  keyword?: string;
  /** Multi-select: one or more pipeline statuses. Empty array = all. */
  statuses?: string[];
  /** Inclusive date range filter on `appliedAt`. ISO strings. */
  appliedFrom?: string;
  appliedTo?: string;
};

export const appliedKey = (f: AppliedFilter) => ["applied", f] as const;

export function useApplied(filter: AppliedFilter) {
  return useQuery({
    queryKey: appliedKey(filter),
    queryFn: () => {
      const p = new URLSearchParams();
      for (const c of filter.companies ?? []) if (c) p.append("company", c);
      if (filter.keyword) p.set("keyword", filter.keyword);
      for (const s of filter.statuses ?? []) if (s) p.append("status", s);
      const qs = p.toString();
      return api.get<AppliedJobsEnvelope>(`/api/applied-jobs${qs ? `?${qs}` : ""}`);
    },
    staleTime: 15_000,
  });
}

export function useUpdateStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { jobKey: string; status: AppliedStatus }) => api.post("/api/jobs/status", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["applied"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["actionPlan"] });
    },
  });
}
