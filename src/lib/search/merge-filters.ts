import type { PascoListFilters } from "@/types/api/pascos";

export function mergePascoListFilters(
  base: Partial<PascoListFilters>,
  overrides: Partial<PascoListFilters>,
): PascoListFilters {
  const merged: PascoListFilters = { ...base };

  for (const [key, value] of Object.entries(overrides)) {
    if (value !== undefined) {
      (merged as Record<string, unknown>)[key] = value;
    }
  }

  return merged;
}
