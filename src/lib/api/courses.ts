import { queryOptions } from "@tanstack/react-query";

import type {
  CourseDetailResponse,
  CourseListFilters,
  CourseListResponse,
} from "@/types/api/catalog";

import { apiClient, apiFetch } from "./client";
import { queryKeys } from "./query-keys";

export function listCourses(filters: CourseListFilters = {}) {
  return apiClient
    .get<CourseListResponse>("/api/courses", { params: filters })
    .then((response) => response.data);
}

export function getCourse(id: string) {
  return apiFetch<CourseDetailResponse>(`/api/courses/${id}`);
}

export function coursesListOptions(filters: CourseListFilters = {}) {
  return queryOptions({
    queryKey: queryKeys.courses.list(filters),
    queryFn: () => listCourses(filters),
  });
}

export function courseDetailOptions(id: string) {
  return queryOptions({
    queryKey: queryKeys.courses.detail(id),
    queryFn: () => getCourse(id),
  });
}

export type CourseUpdatePayload = {
  title?: string;
  code?: string;
  programIds?: string[];
};

export function updateCourse(id: string, payload: CourseUpdatePayload) {
  return apiClient
    .patch<CourseDetailResponse>(`/api/courses/${id}`, payload)
    .then((response) => response.data);
}

export function deleteCourse(id: string) {
  return apiClient
    .delete<{ success: true }>(`/api/courses/${id}`)
    .then((response) => response.data);
}
