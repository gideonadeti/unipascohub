import type {
  CourseListFilters,
  ProgramListFilters,
} from "@/types/api/catalog";
import type { PascoListFilters } from "@/types/api/pascos";

export const queryKeys = {
  institutions: {
    all: ["institutions"] as const,
    list: () => [...queryKeys.institutions.all, "list"] as const,
    detail: (id: string) =>
      [...queryKeys.institutions.all, "detail", id] as const,
  },
  programs: {
    all: ["programs"] as const,
    list: (filters: ProgramListFilters) =>
      [...queryKeys.programs.all, "list", filters] as const,
    detail: (id: string) => [...queryKeys.programs.all, "detail", id] as const,
  },
  courses: {
    all: ["courses"] as const,
    list: (filters: CourseListFilters) =>
      [...queryKeys.courses.all, "list", filters] as const,
    detail: (id: string) => [...queryKeys.courses.all, "detail", id] as const,
  },
  pascos: {
    all: ["pascos"] as const,
    list: (filters: PascoListFilters) =>
      [...queryKeys.pascos.all, "list", filters] as const,
    detail: (id: string) => [...queryKeys.pascos.all, "detail", id] as const,
  },
  users: {
    me: ["users", "me"] as const,
  },
  search: {
    all: ["search"] as const,
    suggest: (q: string, limit = 8) =>
      [...queryKeys.search.all, "suggest", q, limit] as const,
  },
  moderation: {
    all: ["moderation"] as const,
    pascos: (filters: Record<string, unknown>) =>
      [...queryKeys.moderation.all, "pascos", filters] as const,
    catalog: (filters: Record<string, unknown>) =>
      [...queryKeys.moderation.all, "catalog", filters] as const,
    settings: () => [...queryKeys.moderation.all, "settings"] as const,
  },
  notifications: {
    all: ["notifications"] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.notifications.all, "list", filters] as const,
  },
  catalogSubmissions: {
    all: ["catalog-submissions"] as const,
    mine: (filters: Record<string, unknown>) =>
      [...queryKeys.catalogSubmissions.all, "mine", filters] as const,
  },
} as const;
