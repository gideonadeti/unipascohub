const STORAGE_KEY = "unipascohub:last-upload-catalog";

export type LastUploadCatalogContext = {
  institutionId: string;
  programId: string;
};

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function isValidContext(value: unknown): value is LastUploadCatalogContext {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    typeof record.institutionId === "string" &&
    record.institutionId.length > 0 &&
    typeof record.programId === "string" &&
    record.programId.length > 0
  );
}

export function getLastUploadCatalogContext(): LastUploadCatalogContext | null {
  if (!isBrowser()) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return null;
    }

    const parsed: unknown = JSON.parse(raw);

    if (!isValidContext(parsed)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function saveLastUploadCatalogContext(
  context: LastUploadCatalogContext,
): void {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(context));
  } catch {
    // localStorage may be unavailable in private mode or when quota is exceeded.
  }
}

export function clearLastUploadCatalogContext(): void {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage errors.
  }
}
