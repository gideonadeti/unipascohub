"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  useAdminUsersList,
  usePromoteToModerator,
} from "@/hooks/api/use-admin";

const roleBadgeVariant: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  ADMIN: "destructive",
  MODERATOR: "secondary",
  CONTRIBUTOR: "outline",
  NORMAL_USER: "default",
};

export function AdminUsersClient() {
  const [roleFilter, setRoleFilter] = useState<string>("");
  const usersQuery = useAdminUsersList(roleFilter ? { role: roleFilter } : {});
  const promoteMutation = usePromoteToModerator();

  const users = usersQuery.data?.users ?? [];
  const total = usersQuery.data?.total ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground">
          {total} user{total !== 1 ? "s" : ""} total.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {["", "NORMAL_USER", "CONTRIBUTOR", "MODERATOR", "ADMIN"].map(
          (role) => (
            <Button
              key={role}
              variant={roleFilter === role ? "default" : "outline"}
              size="sm"
              onClick={() => setRoleFilter(role)}
            >
              {role || "All"}
            </Button>
          ),
        )}
      </div>

      {usersQuery.isPending ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : usersQuery.isError ? (
        <p className="text-sm text-destructive">Could not load users.</p>
      ) : users.length === 0 ? (
        <p className="text-sm text-muted-foreground">No users found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Name</th>
                <th className="pb-2 pr-4 font-medium">Role</th>
                <th className="pb-2 pr-4 font-medium">School</th>
                <th className="pb-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b last:border-0">
                  <td className="py-2 pr-4 font-medium">{user.name}</td>
                  <td className="py-2 pr-4">
                    <Badge variant={roleBadgeVariant[user.role] ?? "default"}>
                      {user.role}
                    </Badge>
                  </td>
                  <td className="py-2 pr-4 text-muted-foreground">
                    {user.school ?? "—"}
                  </td>
                  <td className="py-2">
                    {user.role === "NORMAL_USER" ||
                    user.role === "CONTRIBUTOR" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => promoteMutation.mutate(user.id)}
                        disabled={promoteMutation.isPending}
                      >
                        {promoteMutation.isPending ? (
                          <Spinner aria-hidden />
                        ) : null}
                        Promote to moderator
                      </Button>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {user.role === "ADMIN" ? "—" : "Already moderator"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
