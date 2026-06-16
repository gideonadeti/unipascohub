"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import {
  createPasco,
  pascoDetailOptions,
  pascosListOptions,
} from "@/lib/api/pascos";
import { queryKeys } from "@/lib/api/query-keys";
import {
  type PascoCreateFormValues,
  toPascoCreateInput,
} from "@/lib/schemas/pasco-create";
import type { PascoCreateInput, PascoListFilters } from "@/types/api/pascos";

export function usePascosList(filters: PascoListFilters = {}) {
  return useQuery(pascosListOptions(filters));
}

export function usePasco(id: string) {
  return useQuery({
    ...pascoDetailOptions(id),
    enabled: id.length > 0,
  });
}

export function useCreatePasco() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (input: PascoCreateInput) => createPasco(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pascos.all });
      router.push(`/pascos/${data.pasco.id}`);
    },
  });
}

export function useSubmitPascoCreate() {
  const createPascoMutation = useCreatePasco();

  return {
    ...createPascoMutation,
    submit: (values: PascoCreateFormValues) =>
      createPascoMutation.mutateAsync(toPascoCreateInput(values)),
  };
}
