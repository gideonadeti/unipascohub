"use client";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { PascoCloudinaryUpload } from "@/components/pasco-cloudinary-upload";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useSubmitPascoCreate } from "@/hooks/api/use-pascos";
import { ACADEMIC_YEAR_OPTIONS } from "@/lib/academic-year";
import { coursesListOptions } from "@/lib/api/courses";
import { institutionsListOptions } from "@/lib/api/institutions";
import { programsListOptions } from "@/lib/api/programs";
import { formatEnumLabel } from "@/lib/catalog-labels";
import {
  getPascoCreateErrorMessage,
  getPascoFileDuplicatesFromError,
} from "@/lib/pasco-duplicate-error";
import {
  EDUCATION_LEVELS,
  PASCO_CONTENT_TYPES,
  PASCO_TYPES,
  type PascoCreateFormValues,
  pascoCreateFormSchema,
  SEMESTER_TYPES,
  SOLUTION_COMPLETENESS_VALUES,
} from "@/lib/schemas/pasco-create";
import type { Program } from "@/types/api/catalog";

export function PascoCreateForm() {
  const form = useForm<PascoCreateFormValues>({
    resolver: standardSchemaResolver(pascoCreateFormSchema),
    mode: "onTouched",
    defaultValues: {
      institutionId: "",
      programId: "",
      courseId: "",
      academicYear: ACADEMIC_YEAR_OPTIONS[0],
      educationLevel: "LEVEL_100",
      semesterType: "FIRST_SEMESTER",
      type: "END_OF_SEM",
      contentType: "QUESTIONS_ONLY",
      description: "",
      isComplete: true,
      solutionCompleteness: null,
      files: [],
    },
  });

  const institutionId = form.watch("institutionId");
  const programId = form.watch("programId");
  const courseId = form.watch("courseId");
  const contentType = form.watch("contentType");
  const files = form.watch("files");

  const institutions = useQuery(institutionsListOptions());
  const programs = useQuery({
    ...programsListOptions({ institutionId }),
    enabled: institutionId.length > 0,
  });
  const courses = useQuery({
    ...coursesListOptions({ institutionId, programId }),
    enabled: institutionId.length > 0 && programId.length > 0,
  });

  const createPasco = useSubmitPascoCreate();
  const isSubmitting = createPasco.isPending || createPasco.isSuccess;
  const submitDuplicates = createPasco.error
    ? getPascoFileDuplicatesFromError(createPasco.error)
    : null;

  async function onSubmit(values: PascoCreateFormValues) {
    await createPasco.submit(values);
  }

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Upload pasco</CardTitle>
        <CardDescription>
          Add exam papers for a course. Files are uploaded to Cloudinary before
          submission.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id="pasco-create-form"
          className="space-y-6"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <fieldset
            disabled={isSubmitting}
            className="space-y-6 border-0 p-0 m-0 min-w-0"
          >
            <FieldGroup>
              <Controller
                name="institutionId"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="pasco-institution">
                      Institution
                    </FieldLabel>
                    <Select
                      name={field.name}
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        form.setValue("programId", "");
                        form.setValue("courseId", "");
                      }}
                    >
                      <SelectTrigger
                        id="pasco-institution"
                        className="w-full"
                        aria-invalid={fieldState.invalid}
                      >
                        <SelectValue placeholder="Select institution" />
                      </SelectTrigger>
                      <SelectContent>
                        {institutions.data?.institutions.map((institution) => (
                          <SelectItem
                            key={institution.id}
                            value={institution.id}
                          >
                            {institution.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="programId"
                control={form.control}
                render={({ field, fieldState }) => {
                  const programItems = programs.data?.programs ?? [];
                  const selectedProgram =
                    programItems.find(
                      (program) => program.id === field.value,
                    ) ?? null;

                  return (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="pasco-program">Program</FieldLabel>
                      <Combobox
                        items={programItems}
                        value={selectedProgram}
                        onValueChange={(program) => {
                          field.onChange(program?.id ?? "");
                          form.setValue("courseId", "");
                        }}
                        itemToStringLabel={(program) => program.label}
                        itemToStringValue={(program) => program.label}
                        isItemEqualToValue={(a: Program, b: Program) =>
                          a.id === b.id
                        }
                      >
                        <ComboboxInput
                          id="pasco-program"
                          className="w-full"
                          placeholder={
                            institutionId
                              ? "Search programs..."
                              : "Select institution first"
                          }
                          disabled={!institutionId}
                          aria-invalid={fieldState.invalid}
                        />
                        <ComboboxContent>
                          <ComboboxEmpty>No programs found.</ComboboxEmpty>
                          <ComboboxList>
                            {(program) => (
                              <ComboboxItem key={program.id} value={program}>
                                <span className="line-clamp-2 text-left">
                                  {program.label}
                                </span>
                              </ComboboxItem>
                            )}
                          </ComboboxList>
                        </ComboboxContent>
                      </Combobox>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  );
                }}
              />

              <Controller
                name="courseId"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="pasco-course">Course</FieldLabel>
                    <Select
                      name={field.name}
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={!programId}
                    >
                      <SelectTrigger
                        id="pasco-course"
                        className="w-full"
                        aria-invalid={fieldState.invalid}
                      >
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.data?.courses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.code} — {course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="academicYear"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="pasco-academic-year">
                      Academic year
                    </FieldLabel>
                    <Select
                      name={field.name}
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger
                        id="pasco-academic-year"
                        className="w-full"
                        aria-invalid={fieldState.invalid}
                      >
                        <SelectValue placeholder="Select academic year" />
                      </SelectTrigger>
                      <SelectContent>
                        {ACADEMIC_YEAR_OPTIONS.map((year) => (
                          <SelectItem key={year} value={year}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="educationLevel"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="pasco-education-level">
                      Education level
                    </FieldLabel>
                    <Select
                      name={field.name}
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger
                        id="pasco-education-level"
                        className="w-full"
                        aria-invalid={fieldState.invalid}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EDUCATION_LEVELS.map((level) => (
                          <SelectItem key={level} value={level}>
                            {formatEnumLabel(level)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="semesterType"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="pasco-semester">Semester</FieldLabel>
                    <Select
                      name={field.name}
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger
                        id="pasco-semester"
                        className="w-full"
                        aria-invalid={fieldState.invalid}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SEMESTER_TYPES.map((semester) => (
                          <SelectItem key={semester} value={semester}>
                            {formatEnumLabel(semester)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="type"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="pasco-type">Exam type</FieldLabel>
                    <Select
                      name={field.name}
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger
                        id="pasco-type"
                        className="w-full"
                        aria-invalid={fieldState.invalid}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PASCO_TYPES.map((pascoType) => (
                          <SelectItem key={pascoType} value={pascoType}>
                            {formatEnumLabel(pascoType)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="contentType"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="pasco-content-type">
                      Content type
                    </FieldLabel>
                    <Select
                      name={field.name}
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        if (value === "QUESTIONS_ONLY") {
                          form.setValue("solutionCompleteness", null);
                        }
                      }}
                    >
                      <SelectTrigger
                        id="pasco-content-type"
                        className="w-full"
                        aria-invalid={fieldState.invalid}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PASCO_CONTENT_TYPES.map((item) => (
                          <SelectItem key={item} value={item}>
                            {formatEnumLabel(item)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {contentType !== "QUESTIONS_ONLY" && (
                <Controller
                  name="solutionCompleteness"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="pasco-solution-completeness">
                        Solution completeness
                      </FieldLabel>
                      <Select
                        name={field.name}
                        value={field.value ?? undefined}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger
                          id="pasco-solution-completeness"
                          className="w-full"
                          aria-invalid={fieldState.invalid}
                        >
                          <SelectValue placeholder="Select completeness" />
                        </SelectTrigger>
                        <SelectContent>
                          {SOLUTION_COMPLETENESS_VALUES.map((item) => (
                            <SelectItem key={item} value={item}>
                              {formatEnumLabel(item)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              )}

              <Controller
                name="description"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="pasco-description">
                      Description (optional)
                    </FieldLabel>
                    <Textarea
                      {...field}
                      id="pasco-description"
                      rows={4}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="isComplete"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    orientation="horizontal"
                    data-invalid={fieldState.invalid}
                  >
                    <Checkbox
                      id="pasco-is-complete"
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        field.onChange(checked === true)
                      }
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldLabel
                      htmlFor="pasco-is-complete"
                      className="font-normal"
                    >
                      This upload is complete (all pages included)
                    </FieldLabel>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>

            <Separator />

            <PascoCloudinaryUpload
              courseId={courseId}
              files={files}
              filesError={form.formState.errors.files}
              disabled={isSubmitting}
              onFilesChange={(nextFiles) => {
                form.setValue("files", nextFiles, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }}
            />

            {createPasco.error && (
              <Alert variant="destructive">
                <AlertTitle>Could not add pasco</AlertTitle>
                <AlertDescription>
                  {getPascoCreateErrorMessage(createPasco.error)}
                  {submitDuplicates?.map((duplicate) => (
                    <span key={duplicate.contentHash} className="mt-2 block">
                      <Link
                        href={`/pascos/${duplicate.pascoId}`}
                        className="font-medium underline underline-offset-3"
                      >
                        View existing pasco ({duplicate.fileName})
                      </Link>
                    </span>
                  ))}
                </AlertDescription>
              </Alert>
            )}
          </fieldset>
        </form>
      </CardContent>
      <CardFooter>
        <Button type="submit" form="pasco-create-form" disabled={isSubmitting}>
          {createPasco.isSuccess ? (
            <>
              <Spinner />
              Redirecting…
            </>
          ) : createPasco.isPending ? (
            <>
              <Spinner />
              Adding…
            </>
          ) : (
            "Add pasco"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
