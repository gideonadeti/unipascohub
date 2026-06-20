"use client";

import { useQuery } from "@tanstack/react-query";

import { courseDetailOptions, coursesListOptions } from "@/lib/api/courses";
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
