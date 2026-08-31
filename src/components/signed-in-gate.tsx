"use client";

import { SignInButton, useAuth } from "@clerk/nextjs";

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

type SignedInGateProps = {
  children: React.ReactNode;
  title?: string;
  description?: string;
};

export function SignedInGate({
  children,
  title = "Sign in required",
  description = "You must be signed in to view this page.",
}: SignedInGateProps) {
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
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
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

  return children;
}
