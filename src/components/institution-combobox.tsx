"use client";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import type { Institution } from "@/types/api/catalog";

type InstitutionOption = Pick<Institution, "id" | "name">;

type InstitutionComboboxProps = {
  id: string;
  institutions: InstitutionOption[];
  value: string;
  onValueChange: (institutionId: string) => void;
  placeholder?: string;
  disabled?: boolean;
  "aria-invalid"?: boolean;
  allowClear?: boolean;
  emptyMessage?: string;
};

export function InstitutionCombobox({
  id,
  institutions,
  value,
  onValueChange,
  placeholder = "Search institutions...",
  disabled = false,
  "aria-invalid": ariaInvalid,
  allowClear = false,
  emptyMessage = "No institutions found.",
}: InstitutionComboboxProps) {
  const selectedInstitution =
    institutions.find((institution) => institution.id === value) ?? null;

  return (
    <Combobox
      items={institutions}
      value={selectedInstitution}
      onValueChange={(institution) => onValueChange(institution?.id ?? "")}
      itemToStringLabel={(institution) => institution.name}
      itemToStringValue={(institution) => institution.name}
      isItemEqualToValue={(left: InstitutionOption, right: InstitutionOption) =>
        left.id === right.id
      }
    >
      <ComboboxInput
        id={id}
        className="w-full"
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={ariaInvalid}
        showClear={allowClear}
      />
      <ComboboxContent>
        <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
        <ComboboxList>
          {(institution) => (
            <ComboboxItem key={institution.id} value={institution}>
              <span className="line-clamp-2 text-left">{institution.name}</span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
