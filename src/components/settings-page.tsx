"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { ContributorUpgradeCard } from "@/components/contributor-upgrade-card";
import { InstitutionCombobox } from "@/components/institution-combobox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  useCurrentUser,
  useUpdateCurrentUserProfile,
} from "@/hooks/api/use-current-user";
import { useInstitutions } from "@/hooks/api/use-institutions";
import { formatEnumLabel } from "@/lib/catalog-labels";
import { isContributorRole } from "@/lib/pasco-permissions";
import { MAX_SCHOOL_LENGTH } from "@/lib/user-profile";
import type { UserRole } from "@/types/api/users";

const roleBadgeVariant: Record<
  UserRole,
  "default" | "secondary" | "outline" | "destructive"
> = {
  ADMIN: "destructive",
  MODERATOR: "secondary",
  CONTRIBUTOR: "outline",
  NORMAL_USER: "default",
};

function findInstitutionIdBySchool(
  institutions: { id: string; name: string }[],
  school: string | null,
): string {
  if (!school) {
    return "";
  }

  const normalizedSchool = school.toLowerCase().trim();

  const match = institutions.find(
    (institution) => institution.name.toLowerCase().trim() === normalizedSchool,
  );

  return match?.id ?? "";
}

export function SettingsPage() {
  const currentUser = useCurrentUser();
  const institutionsQuery = useInstitutions();
  const updateProfile = useUpdateCurrentUserProfile();

  const user = currentUser.data?.user;
  const institutions = institutionsQuery.data?.institutions ?? [];

  const [school, setSchool] = useState("");
  const [institutionId, setInstitutionId] = useState("");

  useEffect(() => {
    if (!user) {
      return;
    }

    const nextSchool = user.school ?? "";
    setSchool(nextSchool);
    setInstitutionId(findInstitutionIdBySchool(institutions, user.school));
  }, [institutions, user]);

  const savedSchool = user?.school ?? "";
  const trimmedSchool = school.trim();
  const isDirty = trimmedSchool !== savedSchool;
  const isSchoolTooLong = trimmedSchool.length > MAX_SCHOOL_LENGTH;

  const canSave = isDirty && !updateProfile.isPending && !isSchoolTooLong;

  const roleLabel = useMemo(
    () => (user ? formatEnumLabel(user.role) : ""),
    [user],
  );

  function handleInstitutionChange(nextInstitutionId: string) {
    setInstitutionId(nextInstitutionId);

    const institution = institutions.find(
      (item) => item.id === nextInstitutionId,
    );

    if (institution) {
      setSchool(institution.name.trim());
    }
  }

  function handleSave() {
    if (!canSave) {
      return;
    }

    updateProfile.mutate(
      { school: trimmedSchool.length > 0 ? trimmedSchool : null },
      {
        onSuccess: () => {
          toast.success("Profile updated");
        },
        onError: (error) => {
          toast.error(error.message);
        },
      },
    );
  }

  function handleReset() {
    setSchool(savedSchool);
    setInstitutionId(
      findInstitutionIdBySchool(institutions, user?.school ?? null),
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Your account details synced from sign-in.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">Name</p>
            <p className="text-sm text-muted-foreground">{user.name}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Role</p>
            <Badge variant={roleBadgeVariant[user.role]}>{roleLabel}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            To change your name or email, use the account menu in the header.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>School</CardTitle>
          <CardDescription>
            Optional. Helps personalize your experience on Uni Pasco Hub.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="settings-institution">
                Pick from catalog
              </FieldLabel>
              <FieldDescription>
                Choose your institution from the seeded catalog, or enter a
                custom name below.
              </FieldDescription>
              {institutionsQuery.isPending ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Spinner aria-hidden />
                  Loading institutions…
                </div>
              ) : institutionsQuery.isError ? (
                <Alert variant="destructive">
                  <AlertTitle>Could not load institutions</AlertTitle>
                  <AlertDescription>
                    You can still enter your school manually below.
                  </AlertDescription>
                </Alert>
              ) : (
                <InstitutionCombobox
                  id="settings-institution"
                  institutions={institutions}
                  value={institutionId}
                  onValueChange={handleInstitutionChange}
                  allowClear
                  placeholder="Search institutions…"
                />
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="settings-school">School name</FieldLabel>
              <Input
                id="settings-school"
                value={school}
                onChange={(event) => {
                  setSchool(event.target.value);
                  setInstitutionId(
                    findInstitutionIdBySchool(
                      institutions,
                      event.target.value.trim(),
                    ),
                  );
                }}
                placeholder="e.g. University of Cape Coast"
                maxLength={MAX_SCHOOL_LENGTH}
                aria-invalid={isSchoolTooLong}
              />
              {isSchoolTooLong ? (
                <p className="text-sm text-destructive">
                  School name must be {MAX_SCHOOL_LENGTH} characters or fewer.
                </p>
              ) : null}
            </Field>

            <div className="flex flex-wrap gap-2">
              <Button type="button" disabled={!canSave} onClick={handleSave}>
                {updateProfile.isPending ? (
                  <>
                    <Spinner aria-hidden />
                    Saving…
                  </>
                ) : (
                  "Save changes"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!isDirty || updateProfile.isPending}
                onClick={handleReset}
              >
                Reset
              </Button>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      {!isContributorRole(user.role) ? (
        <ContributorUpgradeCard
          title="Become a contributor"
          description="Contributors can upload pascos and request new catalog entries. Upgrade takes one click — no application required."
        />
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Manage in-app notification history and browser push settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Push notifications can be enabled from the bell icon in the header.
          </p>
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href="/notifications">View notification history</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
