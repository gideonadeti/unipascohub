"use client";

import { SignInButton, useAuth } from "@clerk/nextjs";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useCurrentUser } from "@/hooks/api/use-current-user";
import { queryKeys } from "@/lib/api/query-keys";
import { upgradeToContributor } from "@/lib/api/users";
import type { UserRole } from "@/types/api/users";

const CONTRIBUTOR_ROLES = new Set<UserRole>([
  "CONTRIBUTOR",
  "MODERATOR",
  "ADMIN",
]);

type PascoCreateGateProps = {
  children: React.ReactNode;
};

export function PascoCreateGate({ children }: PascoCreateGateProps) {
  const { isSignedIn } = useAuth();
  const currentUser = useCurrentUser();
  const queryClient = useQueryClient();

  const upgradeMutation = useMutation({
    mutationFn: upgradeToContributor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.me });
    },
  });

  if (isSignedIn !== true) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Sign in required</CardTitle>
          <CardDescription>
            You must be signed in to upload a pasco.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignInButton mode="modal">
            <Button type="button">Sign in</Button>
          </SignInButton>
        </CardContent>
      </Card>
    );
  }

  if (currentUser.isPending) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner />
        Loading account…
      </div>
    );
  }

  if (currentUser.error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Could not load account</AlertTitle>
        <AlertDescription>{currentUser.error.message}</AlertDescription>
      </Alert>
    );
  }

  const role = currentUser.data?.user.role;

  if (!role || !CONTRIBUTOR_ROLES.has(role)) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Contributor access required</CardTitle>
          <CardDescription>
            Only contributors can upload pascos. Upgrade your account to
            continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {upgradeMutation.error && (
            <Alert variant="destructive">
              <AlertTitle>Upgrade failed</AlertTitle>
              <AlertDescription>
                {upgradeMutation.error.message}
              </AlertDescription>
            </Alert>
          )}
          <Button
            type="button"
            onClick={() => upgradeMutation.mutate()}
            disabled={upgradeMutation.isPending}
          >
            {upgradeMutation.isPending ? (
              <>
                <Spinner />
                Upgrading…
              </>
            ) : (
              "Become a contributor"
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return children;
}
