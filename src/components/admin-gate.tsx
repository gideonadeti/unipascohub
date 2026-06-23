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

type AdminGateProps = {
  children: React.ReactNode;
};

export function AdminGate({ children }: AdminGateProps) {
  const { isSignedIn } = useAuth();
  const currentUser = useCurrentUser();

  if (isSignedIn !== true) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Sign in required</CardTitle>
          <CardDescription>
            You must be signed in to access admin tools.
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
        Loading…
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

  const user = currentUser.data?.user;

  if (!user || user.role !== "ADMIN") {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Not allowed</CardTitle>
          <CardDescription>
            Only administrators can access this page.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return children;
}
