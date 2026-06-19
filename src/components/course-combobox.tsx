"use client";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { formatCourseLabel } from "@/lib/pasco-display";
import type { Course } from "@/types/api/catalog";

type CourseOption = Pick<Course, "id" | "code" | "title">;

type CourseComboboxProps = {
  id: string;
  courses: CourseOption[];
  value: string;
  onValueChange: (courseId: string) => void;
  placeholder?: string;
  disabled?: boolean;
  "aria-invalid"?: boolean;
  allowClear?: boolean;
  emptyMessage?: string;
};

export function CourseCombobox({
  id,
  courses,
  value,
  onValueChange,
  placeholder = "Search courses...",
  disabled = false,
  "aria-invalid": ariaInvalid,
  allowClear = false,
  emptyMessage = "No courses found.",
}: CourseComboboxProps) {
  const selectedCourse = courses.find((course) => course.id === value) ?? null;

  return (
    <Combobox
      items={courses}
      value={selectedCourse}
      onValueChange={(course) => onValueChange(course?.id ?? "")}
      itemToStringLabel={formatCourseLabel}
      itemToStringValue={(course) => `${course.code} ${course.title}`}
      isItemEqualToValue={(left: CourseOption, right: CourseOption) =>
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
          {(course) => (
            <ComboboxItem key={course.id} value={course}>
              <span className="line-clamp-2 text-left">
                {formatCourseLabel(course)}
              </span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
