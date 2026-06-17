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
import { usePasco } from "@/hooks/api/use-pascos";
import { canUserModifyPasco } from "@/lib/pasco-permissions";

type PascoEditGateProps = {
  pascoId: string;
  children: React.ReactNode;
};

export function PascoEditGate({ pascoId, children }: PascoEditGateProps) {
  const { isSignedIn } = useAuth();
  const currentUser = useCurrentUser();
  const pascoQuery = usePasco(pascoId);

  if (isSignedIn !== true) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Sign in required</CardTitle>
          <CardDescription>
            You must be signed in to edit a pasco.
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

  if (currentUser.isPending || pascoQuery.isPending) {
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

  if (pascoQuery.error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Could not load pasco</AlertTitle>
        <AlertDescription>{pascoQuery.error.message}</AlertDescription>
      </Alert>
    );
  }

  const user = currentUser.data?.user;
  const pasco = pascoQuery.data.pasco;

  if (!user || !canUserModifyPasco(user, pasco)) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Not allowed</CardTitle>
          <CardDescription>
            Only the uploader or a moderator can edit this pasco.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return children;
}
