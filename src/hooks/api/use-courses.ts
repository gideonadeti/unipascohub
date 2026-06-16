"use client";

import { useQuery } from "@tanstack/react-query";

import { coursesListOptions } from "@/lib/api/courses";
import type { CourseListFilters } from "@/types/api/catalog";

export function useCourses(filters: CourseListFilters = {}) {
  return useQuery(coursesListOptions(filters));
}
