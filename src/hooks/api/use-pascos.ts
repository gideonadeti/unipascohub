"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  createPasco,
  deletePasco,
  myPascosListOptions,
  pascoDetailOptions,
  pascosListOptions,
  updatePasco,
} from "@/lib/api/pascos";
import { queryKeys } from "@/lib/api/query-keys";
import {
  type PascoCreateFormValues,
  toPascoCreateInput,
} from "@/lib/schemas/pasco-create";
import {
  type PascoEditFormValues,
  toPascoUpdateInput,
} from "@/lib/schemas/pasco-update";
import type {
  MyPascoListFilters,
  PascoCreateInput,
  PascoListFilters,
  PascoUpdateInput,
} from "@/types/api/pascos";

export function usePascosList(filters: PascoListFilters = {}) {
  return useQuery(pascosListOptions(filters));
}

export function useMyPascosList(filters: MyPascoListFilters = {}) {
  return useQuery(myPascosListOptions(filters));
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

export function useUpdatePasco(pascoId: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (input: PascoUpdateInput) => updatePasco(pascoId, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pascos.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.pascos.detail(pascoId),
      });
      router.push(`/pascos/${data.pasco.id}`);
    },
  });
}

export function useSubmitPascoEdit(pascoId: string) {
  const updatePascoMutation = useUpdatePasco(pascoId);

  return {
    ...updatePascoMutation,
    submit: (values: PascoEditFormValues) =>
      updatePascoMutation.mutateAsync(toPascoUpdateInput(values)),
  };
}

export function useDeletePasco(pascoId: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: () => deletePasco(pascoId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pascos.all });
      queryClient.removeQueries({ queryKey: queryKeys.pascos.detail(pascoId) });

      if (
        data.storageCleanupFailures &&
        data.storageCleanupFailures.length > 0
      ) {
        toast.warning(
          "Pasco deleted, but some attached files could not be removed.",
        );
      } else {
        toast.success("Pasco deleted");
      }

      router.push("/");
    },
  });
}
