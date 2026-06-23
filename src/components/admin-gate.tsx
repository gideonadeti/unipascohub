"use client";

import { SignInButton, useAuth } from "@clerk/nextjs";
import Link from "next/link";

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
import { cn } from "@/lib/utils";

type AdminGateProps = {
  children: React.ReactNode;
};

export function AdminGate({ children }: AdminGateProps) {
  const { isSignedIn } = useAuth();
  const currentUser = useCurrentUser();

  if (isSignedIn !== true) {
    return (
      <Card className={cn("w-full max-w-md", "mx-auto mt-16")}>
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
      <Card className={cn("w-full max-w-md", "mx-auto mt-16")}>
        <CardHeader>
          <CardTitle>Not allowed</CardTitle>
          <CardDescription>
            Only administrators can access this page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <Link href="/">Go home</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return children;
}
