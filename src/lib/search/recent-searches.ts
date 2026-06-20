const STORAGE_KEY = "unipascohub:recent-searches";
export const MAX_RECENT_SEARCHES = 8;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getRecentSearches(): string[] {
  if (!isBrowser()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

function saveRecentSearches(searches: string[]): void {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(searches));
  } catch {
    // localStorage may be unavailable in private mode or when quota is exceeded.
  }
}

export function addRecentSearch(query: string): void {
  const trimmed = query.trim();

  if (trimmed.length < 2) {
    return;
  }

  const normalized = trimmed.toLowerCase();
  const existing = getRecentSearches().filter(
    (item) => item.toLowerCase() !== normalized,
  );

  saveRecentSearches([trimmed, ...existing].slice(0, MAX_RECENT_SEARCHES));
}

export function removeRecentSearch(query: string): void {
  const normalized = query.trim().toLowerCase();
  const next = getRecentSearches().filter(
    (item) => item.toLowerCase() !== normalized,
  );

  saveRecentSearches(next);
}

export function clearRecentSearches(): void {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage errors.
  }
}
