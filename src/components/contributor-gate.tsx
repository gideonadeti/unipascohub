"use client";

import { SignInButton, useAuth } from "@clerk/nextjs";

import { ContributorUpgradeCard } from "@/components/contributor-upgrade-card";
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
import { isContributorRole } from "@/lib/pasco-permissions";

type ContributorGateProps = {
  children: React.ReactNode;
};

export function ContributorGate({ children }: ContributorGateProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const currentUser = useCurrentUser();

  if (!isLoaded) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner aria-hidden />
        Loading…
      </div>
    );
  }

  if (isSignedIn !== true) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Sign in required</CardTitle>
          <CardDescription>
            You must be signed in to view your contributions.
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
        <Spinner aria-hidden />
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

  if (!isContributorRole(role)) {
    return (
      <ContributorUpgradeCard description="Only contributors can view and manage uploads and catalog requests. Upgrade your account to continue." />
    );
  }

  return children;
}
