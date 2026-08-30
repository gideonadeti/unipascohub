import { FaGithub } from "react-icons/fa6";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { SiteContributor } from "@/config/site";
import {
  getContributorInitials,
  getGitHubAvatarUrl,
  getGitHubProfileUrl,
  hasGitHubProfile,
  normalizeGitHubUsername,
} from "@/lib/contributor-links";

type ContributorCardProps = {
  contributor: SiteContributor;
};

export function ContributorCard({ contributor }: ContributorCardProps) {
  const githubUsername = normalizeGitHubUsername(contributor.github);
  const showGitHub = hasGitHubProfile(contributor.github);
  const avatarUrl = getGitHubAvatarUrl(contributor);
  const initials = getContributorInitials(contributor.name);
  const profileUrl = showGitHub
    ? getGitHubProfileUrl(githubUsername)
    : undefined;

  const avatar = (
    <Avatar size="lg" className="size-12">
      {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );

  return (
    <Card>
      <CardContent className="flex items-start gap-4">
        {profileUrl ? (
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            aria-label={`${contributor.name} on GitHub`}
          >
            {avatar}
          </a>
        ) : (
          avatar
        )}
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {profileUrl ? (
              <a
                href={profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline-offset-4 hover:underline"
              >
                {contributor.name}
              </a>
            ) : (
              <p className="font-medium">{contributor.name}</p>
            )}
            {contributor.role === "lead" ? (
              <Badge variant="secondary">Lead</Badge>
            ) : null}
          </div>
          {contributor.title ? (
            <p className="text-sm text-muted-foreground">{contributor.title}</p>
          ) : null}
          {showGitHub ? (
            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              <FaGithub className="size-4 shrink-0" aria-hidden />
              <span>@{githubUsername}</span>
            </a>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
