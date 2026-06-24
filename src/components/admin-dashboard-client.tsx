"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminDashboardStats } from "@/hooks/api/use-admin";

const statCards = [
  { key: "totalUsers", label: "Total users" },
  { key: "totalPascos", label: "Total pascos" },
  { key: "publishedPascos", label: "Published pascos" },
  { key: "pendingModeration", label: "Pending moderation" },
  { key: "totalCleanupRuns", label: "Cleanup runs" },
  { key: "unresolvedFailures", label: "Unresolved failures" },
] as const;

export function AdminDashboardClient() {
  const statsQuery = useAdminDashboardStats();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground">
          Key metrics for Uni Pasco Hub.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map(({ key, label }) => (
          <Card key={key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsQuery.isPending ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-3xl font-bold">
                  {statsQuery.data?.[key] ?? "—"}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
