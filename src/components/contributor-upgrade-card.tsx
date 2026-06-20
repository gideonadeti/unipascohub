"use client";

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
import { queryKeys } from "@/lib/api/query-keys";
import { upgradeToContributor } from "@/lib/api/users";

type ContributorUpgradeCardProps = {
  title?: string;
  description?: string;
};

export function ContributorUpgradeCard({
  title = "Contributor access required",
  description = "Only contributors can upload and manage contributions. Upgrade your account to continue.",
}: ContributorUpgradeCardProps) {
  const queryClient = useQueryClient();

  const upgradeMutation = useMutation({
    mutationFn: upgradeToContributor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.me });
    },
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {upgradeMutation.error ? (
          <Alert variant="destructive">
            <AlertTitle>Upgrade failed</AlertTitle>
            <AlertDescription>{upgradeMutation.error.message}</AlertDescription>
          </Alert>
        ) : null}
        <Button
          type="button"
          onClick={() => upgradeMutation.mutate()}
          disabled={upgradeMutation.isPending}
        >
          {upgradeMutation.isPending ? (
            <>
              <Spinner aria-hidden />
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
