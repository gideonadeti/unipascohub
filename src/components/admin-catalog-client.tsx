"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useDeleteCourse, useUpdateCourse } from "@/hooks/api/use-courses";
import { institutionsListOptions } from "@/lib/api/institutions";
import { programsListOptions } from "@/lib/api/programs";
import type { Course, Program } from "@/types/api/catalog";

type EditingCourse = Course & { programIds?: string[] };

function CourseEditDialog({
  course,
  programs,
  open,
  onOpenChange,
}: {
  course: EditingCourse | null;
  programs: Program[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const updateMutation = useUpdateCourse();
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [selectedProgramIds, setSelectedProgramIds] = useState<string[]>([]);

  useEffect(() => {
    if (open && course) {
      setCode(course.code);
      setTitle(course.title);
      setSelectedProgramIds(course.programIds ?? []);
    } else if (!open) {
      setCode("");
      setTitle("");
      setSelectedProgramIds([]);
    }
  }, [open, course]);

  const handleSave = () => {
    if (!course) return;
    const payload: { code?: string; title?: string; programIds?: string[] } =
      {};
    const trimmedCode = code.trim();
    const trimmedTitle = title.trim();
    if (trimmedCode && trimmedCode !== course.code) payload.code = trimmedCode;
    if (trimmedTitle && trimmedTitle !== course.title)
      payload.title = trimmedTitle;
    const sortedExisting = [...(course.programIds ?? [])].sort().join(",");
    const sortedSelected = [...selectedProgramIds].sort().join(",");
    if (sortedExisting !== sortedSelected)
      payload.programIds = selectedProgramIds;
    if (Object.keys(payload).length === 0) {
      onOpenChange(false);
      return;
    }
    updateMutation.mutate(
      { id: course.id, payload },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  const toggleProgram = (programId: string) => {
    setSelectedProgramIds((prev) =>
      prev.includes(programId)
        ? prev.filter((id) => id !== programId)
        : [...prev, programId],
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit course</DialogTitle>
          <DialogDescription>
            Update code, title, or link this course to other programs in the
            same institution.
          </DialogDescription>
        </DialogHeader>
        {course ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-course-code">Course code</Label>
              <Input
                id="edit-course-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. DCIT 101"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-course-title">Course title</Label>
              <Input
                id="edit-course-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Introduction to Programming"
              />
            </div>
            <div className="space-y-2">
              <Label>Programs ({selectedProgramIds.length} selected)</Label>
              {programs.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No programs for this institution yet.
                </p>
              ) : (
                <div className="max-h-48 overflow-y-auto rounded-md border p-2 space-y-1">
                  {programs.map((program) => {
                    const checked = selectedProgramIds.includes(program.id);
                    return (
                      <label
                        key={program.id}
                        className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-muted cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleProgram(program.id)}
                          className="h-4 w-4 rounded border-border"
                        />
                        <span className="text-sm flex-1">{program.label}</span>
                        {checked ? (
                          <Badge variant="secondary" className="text-xs">
                            Linked
                          </Badge>
                        ) : null}
                      </label>
                    );
                  })}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                A course can belong to multiple programs. Linking it makes it
                appear when that program is selected in the upload form.
              </p>
            </div>
          </div>
        ) : null}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending || !code.trim() || !title.trim()}
          >
            {updateMutation.isPending ? <Spinner aria-hidden /> : null}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AdminCatalogClient() {
  const [institutionId, setInstitutionId] = useState("");
  const [programId, setProgramId] = useState("");
  const [search, setSearch] = useState("");
  const [editingCourse, setEditingCourse] = useState<EditingCourse | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<EditingCourse | null>(null);

  const institutionsQuery = useQuery(institutionsListOptions());
  const programsQuery = useQuery({
    ...programsListOptions({ institutionId }),
    enabled: institutionId.length > 0,
  });
  // Direct fetch for courses to avoid circular import and to get programIds included
  const {
    data: coursesData,
    isPending: coursesPending,
    isError: coursesError,
  } = useQuery({
    queryKey: ["courses", "list", { institutionId, programId }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (institutionId) params.set("institutionId", institutionId);
      if (programId) params.set("programId", programId);
      const res = await fetch(`/api/courses?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load courses");
      return (await res.json()) as { courses: EditingCourse[] };
    },
    enabled: institutionId.length > 0,
  });

  const deleteMutation = useDeleteCourse();

  const programs = programsQuery.data?.programs ?? [];
  const courses = coursesData?.courses ?? [];

  const programMap = useMemo(() => {
    const map = new Map<string, Program>();
    for (const p of programs) map.set(p.id, p);
    return map;
  }, [programs]);

  const filteredCourses = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter(
      (c) =>
        c.code.toLowerCase().includes(q) || c.title.toLowerCase().includes(q),
    );
  }, [courses, search]);

  const handleInstitutionChange = (value: string) => {
    setInstitutionId(value);
    setProgramId("");
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Catalog</h1>
        <p className="text-sm text-muted-foreground">
          Manage courses and their program links. A course code is unique per
          institution and can be linked to multiple programs.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>
            Select an institution to view and edit its courses.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="catalog-institution">Institution</Label>
              <select
                id="catalog-institution"
                value={institutionId}
                onChange={(e) => handleInstitutionChange(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="">Select institution</option>
                {institutionsQuery.data?.institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="catalog-program">Program (filter)</Label>
              <select
                id="catalog-program"
                value={programId}
                onChange={(e) => setProgramId(e.target.value)}
                disabled={!institutionId}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
              >
                <option value="">All programs</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="catalog-search">Search (code or title)</Label>
              <Input
                id="catalog-search"
                placeholder="e.g. DCIT or programming"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                disabled={!institutionId}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {!institutionId ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Select an institution to see courses.
          </CardContent>
        </Card>
      ) : coursesPending ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : coursesError ? (
        <Card>
          <CardContent className="py-8 text-sm text-destructive">
            Could not load courses.
          </CardContent>
        </Card>
      ) : filteredCourses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">
              {courses.length === 0
                ? "No courses for this filter yet."
                : "No courses match your search."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Courses ({filteredCourses.length}
              {search ? ` / ${courses.length}` : ""})
            </CardTitle>
            <CardDescription>
              Click Edit to change code/title or add this course to another
              program so it appears there in the upload form.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="px-4 py-2 font-medium">Code</th>
                    <th className="px-4 py-2 font-medium">Title</th>
                    <th className="px-4 py-2 font-medium">Programs</th>
                    <th className="px-4 py-2 font-medium">Updated</th>
                    <th className="px-4 py-2 font-medium text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCourses.map((course) => {
                    const c = course as EditingCourse;
                    const linked = c.programIds ?? [];
                    return (
                      <tr
                        key={c.id}
                        className="border-b last:border-0 hover:bg-muted/50"
                      >
                        <td className="px-4 py-2 font-mono text-xs font-medium">
                          {c.code}
                        </td>
                        <td
                          className="px-4 py-2 max-w-xs truncate"
                          title={c.title}
                        >
                          {c.title}
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {linked.length === 0 ? (
                              <span className="text-xs text-muted-foreground">
                                — not linked
                              </span>
                            ) : (
                              linked.map((pid) => {
                                const prog = programMap.get(pid);
                                return (
                                  <Badge
                                    key={pid}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {prog ? prog.label : pid.slice(0, 6)}
                                  </Badge>
                                );
                              })
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-xs text-muted-foreground">
                          {new Date(c.updatedAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingCourse(c)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDeleteTarget(c)}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      <p className="text-xs text-muted-foreground">
        Tip: If a student says &ldquo;I added DCIT 101 under HND but it
        doesn&rsquo;t show for Degree,&rdquo; open it here and tick the Degree
        program to link it.
      </p>

      <CourseEditDialog
        course={editingCourse}
        programs={programs}
        open={!!editingCourse}
        onOpenChange={(open) => {
          if (!open) {
            setEditingCourse(null);
          }
        }}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete course?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-medium">
                {deleteTarget?.code} — {deleteTarget?.title}
              </span>
              . Courses with linked pascos cannot be deleted (remove pascos
              first).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (!deleteTarget) return;
                deleteMutation.mutate(deleteTarget.id, {
                  onSuccess: () => setDeleteTarget(null),
                });
              }}
            >
              {deleteMutation.isPending ? (
                <Spinner aria-hidden className="mr-2" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
