"use client";

import { useQuery } from "@tanstack/react-query";

import { institutionsListOptions } from "@/lib/api/institutions";

export function useInstitutions() {
  return useQuery(institutionsListOptions());
}
