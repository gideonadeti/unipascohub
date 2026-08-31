"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  type CourseUpdatePayload,
  courseDetailOptions,
  coursesListOptions,
  deleteCourse,
  updateCourse,
} from "@/lib/api/courses";
import { queryKeys } from "@/lib/api/query-keys";
import type { CourseListFilters } from "@/types/api/catalog";

export function useCourses(filters: CourseListFilters = {}) {
  return useQuery(coursesListOptions(filters));
}

export function useCourse(id: string) {
  return useQuery({
    ...courseDetailOptions(id),
    enabled: id.length > 0,
  });
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: CourseUpdatePayload;
    }) => updateCourse(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.courses.detail(variables.id),
      });
      toast.success("Course updated");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Could not update course";
      toast.error(message);
    },
  });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCourse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.all });
      toast.success("Course deleted");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Could not delete course";
      toast.error(message);
    },
  });
}
