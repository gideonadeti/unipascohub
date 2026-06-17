export function asHashableFile(
  file: File | { name?: string; size?: number },
): File | null {
  return file instanceof File ? file : null;
}

export async function hashFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashFiles(files: File[]): Promise<Map<string, string>> {
  const hashes = new Map<string, string>();

  for (const file of files) {
    const hash = await hashFile(file);
    hashes.set(file.name, hash);
  }

  return hashes;
}
