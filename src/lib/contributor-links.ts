import type { SiteContributor } from "@/config/site";

export function normalizeGitHubUsername(value: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  const withoutProtocol = trimmed.replace(/^https?:\/\//i, "");
  const match = withoutProtocol.match(/(?:^|\/)github\.com\/([^/?#]+)/i);

  if (match) {
    return match[1];
  }

  return trimmed.replace(/^@/, "").replace(/\/$/, "");
}

export function hasGitHubProfile(username: string): boolean {
  return normalizeGitHubUsername(username).length > 0;
}

export function getGitHubProfileUrl(username: string): string {
  return `https://github.com/${normalizeGitHubUsername(username)}`;
}

export function getGitHubAvatarUrl(
  contributor: SiteContributor,
): string | null {
  if (contributor.avatarUrl) {
    return contributor.avatarUrl;
  }

  const username = normalizeGitHubUsername(contributor.github);

  if (!username) {
    return null;
  }

  return `https://github.com/${username}.png`;
}

export function getDisplayInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

export function getContributorInitials(name: string): string {
  return getDisplayInitials(name);
}
