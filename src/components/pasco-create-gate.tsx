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

type PascoCreateGateProps = {
  children: React.ReactNode;
};

export function PascoCreateGate({ children }: PascoCreateGateProps) {
  const { isSignedIn } = useAuth();
  const currentUser = useCurrentUser();

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
      <ContributorUpgradeCard description="Only contributors can upload pascos. Upgrade your account to continue." />
    );
  }

  return children;
}
