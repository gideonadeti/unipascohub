import { normalizeCourseCode } from "@/lib/catalog-code";
import { formatProgramLabel } from "@/lib/catalog-labels";
import {
  createCourse,
  isDuplicateCodeError,
  validateProgramIds,
} from "@/lib/courses";
import { prisma } from "@/lib/db";
import {
  createCatalogCourseAutoApprovedNotification,
  createCatalogSubmissionApprovedNotification,
  createCatalogSubmissionPendingNotifications,
  createCatalogSubmissionRejectedNotification,
} from "@/lib/notifications";
import { createProgram } from "@/lib/programs";
import type { CatalogSubmission } from "../../generated/prisma/client";
import {
  CatalogSubmissionStatus,
  type CatalogSubmissionStatus as CatalogSubmissionStatusValue,
  CatalogSubmissionType,
  type CatalogSubmissionType as CatalogSubmissionTypeValue,
  ProgramType,
  type ProgramType as ProgramTypeValue,
} from "../../generated/prisma/enums";

const MAX_NAME_LENGTH = 200;
const MAX_CODE_LENGTH = 50;

const PROGRAM_TYPES = new Set<string>(Object.values(ProgramType));

export type CatalogProgramSubmissionInput = {
  type: "PROGRAM";
  institutionId: string;
  programName: string;
  programType: ProgramTypeValue;
};

export type CatalogCourseSubmissionInput = {
  type: "COURSE";
  institutionId: string;
  courseCode: string;
  courseTitle: string;
  programIds: string[];
};

export type CatalogSubmissionCreateInput =
  | CatalogProgramSubmissionInput
  | CatalogCourseSubmissionInput;

type CatalogSubmissionParseError =
  | "invalid_body"
  | "invalid_type"
  | "invalid_institution_id"
  | "invalid_program_name"
  | "invalid_program_type"
  | "invalid_course_code"
  | "invalid_course_title"
  | "invalid_program_ids";

export type CatalogSubmissionCreateError =
  | "institution_not_found"
  | "duplicate_live_program"
  | "duplicate_pending_program"
  | "duplicate_live_course"
  | "duplicate_pending_course"
  | "program_not_found"
  | "program_institution_mismatch"
  | "duplicate_code";

export type ModerateCatalogSubmissionAction = "approve" | "reject";

export type ModerateCatalogSubmissionError =
  | "not_found"
  | "invalid_transition"
  | "reason_required"
  | "institution_not_found"
  | "program_not_found"
  | "program_institution_mismatch"
  | "duplicate_name_and_type"
  | "duplicate_code";

export type ModerateCatalogSubmissionSuccess = {
  submissionId: string;
  status: CatalogSubmissionStatusValue;
  notifySubmitterApproved: {
    submitterId: string;
    institutionId: string;
    programId?: string;
    courseId?: string;
  } | null;
  notifySubmitterRejected: {
    submitterId: string;
    summary: string;
    reason: string;
  } | null;
  summary: string;
};

type CatalogSubmissionWithRelations = CatalogSubmission & {
  institution: { id: string; name: string };
  submitter: { id: string; name: string };
  reviewer: { id: string; name: string } | null;
};

function parseInstitutionId(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const institutionId = value.trim();

  return institutionId.length > 0 ? institutionId : null;
}

function parseProgramName(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const name = value.trim();

  if (name.length === 0 || name.length > MAX_NAME_LENGTH) {
    return null;
  }

  return name;
}

function parseCourseCode(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const code = value.trim();

  if (code.length === 0 || code.length > MAX_CODE_LENGTH) {
    return null;
  }

  return code;
}

function parseCourseTitle(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const title = value.trim();

  if (title.length === 0 || title.length > MAX_NAME_LENGTH) {
    return null;
  }

  return title;
}

function isProgramType(value: string): value is ProgramTypeValue {
  return PROGRAM_TYPES.has(value);
}

function parseProgramIds(value: unknown): string[] | null {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value) || value.some((id) => typeof id !== "string")) {
    return null;
  }

  const programIds = value.map((id) => id.trim()).filter((id) => id.length > 0);

  if (programIds.length !== value.length) {
    return null;
  }

  return programIds;
}

export function parseCatalogSubmissionCreate(
  body: unknown,
):
  | { success: true; data: CatalogSubmissionCreateInput }
  | { success: false; error: CatalogSubmissionParseError } {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return { success: false, error: "invalid_body" };
  }

  const record = body as Record<string, unknown>;
  const type = record.type;

  if (
    type !== CatalogSubmissionType.PROGRAM &&
    type !== CatalogSubmissionType.COURSE
  ) {
    return { success: false, error: "invalid_type" };
  }

  const institutionId = parseInstitutionId(record.institutionId);

  if (!institutionId) {
    return { success: false, error: "invalid_institution_id" };
  }

  if (type === CatalogSubmissionType.PROGRAM) {
    const programName = parseProgramName(record.programName);
    const programType = record.programType;

    if (!programName) {
      return { success: false, error: "invalid_program_name" };
    }

    if (typeof programType !== "string" || !isProgramType(programType)) {
      return { success: false, error: "invalid_program_type" };
    }

    return {
      success: true,
      data: {
        type: "PROGRAM",
        institutionId,
        programName,
        programType,
      },
    };
  }

  const courseCode = parseCourseCode(record.courseCode);
  const courseTitle = parseCourseTitle(record.courseTitle);
  const programIds = parseProgramIds(record.programIds);

  if (!courseCode) {
    return { success: false, error: "invalid_course_code" };
  }

  if (!courseTitle) {
    return { success: false, error: "invalid_course_title" };
  }

  if (programIds === null) {
    return { success: false, error: "invalid_program_ids" };
  }

  return {
    success: true,
    data: {
      type: "COURSE",
      institutionId,
      courseCode: normalizeCourseCode(courseCode),
      courseTitle,
      programIds,
    },
  };
}

export function getCatalogSubmissionSummary(
  submission: Pick<
    CatalogSubmission,
    "type" | "programName" | "programType" | "courseCode" | "courseTitle"
  >,
): string {
  if (submission.type === CatalogSubmissionType.PROGRAM) {
    if (submission.programName && submission.programType) {
      return formatProgramLabel({
        name: submission.programName,
        type: submission.programType,
      });
    }

    return "Program request";
  }

  if (submission.courseCode && submission.courseTitle) {
    return `${submission.courseCode} — ${submission.courseTitle}`;
  }

  return "Course request";
}

async function findDuplicateLiveProgram(input: CatalogProgramSubmissionInput) {
  return prisma.program.findFirst({
    where: {
      institutionId: input.institutionId,
      name: input.programName,
      type: input.programType,
    },
    select: { id: true },
  });
}

async function findDuplicatePendingProgram(
  input: CatalogProgramSubmissionInput,
) {
  return prisma.catalogSubmission.findFirst({
    where: {
      type: CatalogSubmissionType.PROGRAM,
      status: CatalogSubmissionStatus.PENDING,
      institutionId: input.institutionId,
      programName: input.programName,
      programType: input.programType,
    },
    select: { id: true },
  });
}

async function findDuplicateLiveCourse(input: CatalogCourseSubmissionInput) {
  return prisma.course.findFirst({
    where: {
      institutionId: input.institutionId,
      code: input.courseCode,
    },
    select: { id: true },
  });
}

async function findDuplicatePendingCourse(input: CatalogCourseSubmissionInput) {
  return prisma.catalogSubmission.findFirst({
    where: {
      type: CatalogSubmissionType.COURSE,
      status: CatalogSubmissionStatus.PENDING,
      institutionId: input.institutionId,
      courseCode: input.courseCode,
    },
    select: { id: true },
  });
}

export async function createCatalogSubmission(
  submitterId: string,
  input: CatalogSubmissionCreateInput,
): Promise<
  | { success: true; submission: CatalogSubmissionWithRelations }
  | { success: false; error: CatalogSubmissionCreateError }
> {
  const institution = await prisma.institution.findUnique({
    where: { id: input.institutionId },
    select: { id: true },
  });

  if (!institution) {
    return { success: false, error: "institution_not_found" };
  }

  if (input.type === "PROGRAM") {
    const [liveDuplicate, pendingDuplicate] = await Promise.all([
      findDuplicateLiveProgram(input),
      findDuplicatePendingProgram(input),
    ]);

    if (liveDuplicate) {
      return { success: false, error: "duplicate_live_program" };
    }

    if (pendingDuplicate) {
      return { success: false, error: "duplicate_pending_program" };
    }

    const submission = await prisma.catalogSubmission.create({
      data: {
        type: CatalogSubmissionType.PROGRAM,
        institutionId: input.institutionId,
        submitterId,
        programName: input.programName,
        programType: input.programType,
      },
      include: submissionInclude,
    });

    const summary = getCatalogSubmissionSummary(submission);
    await createCatalogSubmissionPendingNotifications(summary);

    return { success: true, submission };
  }

  const [liveDuplicate, pendingDuplicate] = await Promise.all([
    findDuplicateLiveCourse(input),
    findDuplicatePendingCourse(input),
  ]);

  if (liveDuplicate) {
    return { success: false, error: "duplicate_live_course" };
  }

  if (input.programIds.length > 0) {
    const programValidation = await validateProgramIds(
      input.institutionId,
      input.programIds,
    );

    if (!programValidation.success) {
      return { success: false, error: programValidation.error };
    }

    const reviewedAt = new Date();

    try {
      const submission = await prisma.$transaction(async (tx) => {
        const course = await tx.course.create({
          data: {
            institutionId: input.institutionId,
            title: input.courseTitle,
            code: input.courseCode,
            programs: {
              connect: input.programIds.map((id) => ({ id })),
            },
          },
        });

        return tx.catalogSubmission.create({
          data: {
            type: CatalogSubmissionType.COURSE,
            status: CatalogSubmissionStatus.APPROVED,
            institutionId: input.institutionId,
            submitterId,
            courseCode: input.courseCode,
            courseTitle: input.courseTitle,
            programIds: input.programIds,
            approvedCourseId: course.id,
            reviewedAt,
          },
          include: submissionInclude,
        });
      });

      const summary = getCatalogSubmissionSummary(submission);
      await createCatalogCourseAutoApprovedNotification(summary);

      return { success: true, submission };
    } catch (error) {
      if (isDuplicateCodeError(error)) {
        return { success: false, error: "duplicate_code" };
      }

      throw error;
    }
  }

  if (pendingDuplicate) {
    return { success: false, error: "duplicate_pending_course" };
  }

  const submission = await prisma.catalogSubmission.create({
    data: {
      type: CatalogSubmissionType.COURSE,
      institutionId: input.institutionId,
      submitterId,
      courseCode: input.courseCode,
      courseTitle: input.courseTitle,
      programIds: input.programIds,
    },
    include: submissionInclude,
  });

  const summary = getCatalogSubmissionSummary(submission);
  await createCatalogSubmissionPendingNotifications(summary);

  return { success: true, submission };
}

const submissionInclude = {
  institution: { select: { id: true, name: true } },
  submitter: { select: { id: true, name: true } },
  reviewer: { select: { id: true, name: true } },
} as const;

export type MyCatalogSubmissionsQuery = {
  submitterId: string;
  institutionId?: string;
  status?: CatalogSubmissionStatusValue;
};

export async function listMyCatalogSubmissions(
  query: MyCatalogSubmissionsQuery,
) {
  const where = {
    submitterId: query.submitterId,
    ...(query.institutionId ? { institutionId: query.institutionId } : {}),
    ...(query.status ? { status: query.status } : {}),
  };

  const submissions = await prisma.catalogSubmission.findMany({
    where,
    include: submissionInclude,
    orderBy: { createdAt: "desc" },
  });

  return submissions;
}

export type ModerationCatalogSubmissionListQuery = {
  status?: CatalogSubmissionStatusValue;
  page: number;
  limit: number;
};

export async function listModerationCatalogSubmissions(
  params: ModerationCatalogSubmissionListQuery,
) {
  const status = params.status ?? CatalogSubmissionStatus.PENDING;
  const where = { status };
  const skip = (params.page - 1) * params.limit;

  const [total, submissions] = await Promise.all([
    prisma.catalogSubmission.count({ where }),
    prisma.catalogSubmission.findMany({
      where,
      include: submissionInclude,
      orderBy: { createdAt: "desc" },
      skip,
      take: params.limit,
    }),
  ]);

  return {
    submissions,
    total,
    page: params.page,
    limit: params.limit,
  };
}

export async function moderateCatalogSubmission(input: {
  submissionId: string;
  reviewerId: string;
  action: ModerateCatalogSubmissionAction;
  reason?: string;
}): Promise<
  | { success: true; result: ModerateCatalogSubmissionSuccess }
  | { success: false; error: ModerateCatalogSubmissionError }
> {
  const submission = await prisma.catalogSubmission.findUnique({
    where: { id: input.submissionId },
    include: submissionInclude,
  });

  if (!submission) {
    return { success: false, error: "not_found" };
  }

  const summary = getCatalogSubmissionSummary(submission);

  if (input.action === "reject") {
    if (submission.status !== CatalogSubmissionStatus.PENDING) {
      return { success: false, error: "invalid_transition" };
    }

    const reason = input.reason?.trim();

    if (!reason) {
      return { success: false, error: "reason_required" };
    }

    await prisma.catalogSubmission.update({
      where: { id: submission.id },
      data: {
        status: CatalogSubmissionStatus.REJECTED,
        rejectionReason: reason,
        reviewerId: input.reviewerId,
        reviewedAt: new Date(),
      },
    });

    return {
      success: true,
      result: {
        submissionId: submission.id,
        status: CatalogSubmissionStatus.REJECTED,
        notifySubmitterApproved: null,
        notifySubmitterRejected: {
          submitterId: submission.submitterId,
          summary,
          reason,
        },
        summary,
      },
    };
  }

  if (submission.status !== CatalogSubmissionStatus.PENDING) {
    return { success: false, error: "invalid_transition" };
  }

  if (submission.type === CatalogSubmissionType.PROGRAM) {
    if (!submission.programName || !submission.programType) {
      return { success: false, error: "invalid_transition" };
    }

    const programResult = await createProgram({
      institutionId: submission.institutionId,
      name: submission.programName,
      type: submission.programType,
    });

    if (!programResult.success) {
      return { success: false, error: programResult.error };
    }

    await prisma.catalogSubmission.update({
      where: { id: submission.id },
      data: {
        status: CatalogSubmissionStatus.APPROVED,
        approvedProgramId: programResult.program.id,
        reviewerId: input.reviewerId,
        reviewedAt: new Date(),
        rejectionReason: null,
      },
    });

    return {
      success: true,
      result: {
        submissionId: submission.id,
        status: CatalogSubmissionStatus.APPROVED,
        notifySubmitterApproved: {
          submitterId: submission.submitterId,
          institutionId: submission.institutionId,
          programId: programResult.program.id,
        },
        notifySubmitterRejected: null,
        summary,
      },
    };
  }

  if (!submission.courseCode || !submission.courseTitle) {
    return { success: false, error: "invalid_transition" };
  }

  const courseResult = await createCourse({
    institutionId: submission.institutionId,
    code: submission.courseCode,
    title: submission.courseTitle,
    programIds: submission.programIds,
  });

  if (!courseResult.success) {
    return { success: false, error: courseResult.error };
  }

  const programId = submission.programIds[0];

  await prisma.catalogSubmission.update({
    where: { id: submission.id },
    data: {
      status: CatalogSubmissionStatus.APPROVED,
      approvedCourseId: courseResult.course.id,
      reviewerId: input.reviewerId,
      reviewedAt: new Date(),
      rejectionReason: null,
    },
  });

  return {
    success: true,
    result: {
      submissionId: submission.id,
      status: CatalogSubmissionStatus.APPROVED,
      notifySubmitterApproved: {
        submitterId: submission.submitterId,
        institutionId: submission.institutionId,
        programId,
        courseId: courseResult.course.id,
      },
      notifySubmitterRejected: null,
      summary,
    },
  };
}

export async function runCatalogSubmissionSideEffects(
  result: ModerateCatalogSubmissionSuccess,
): Promise<void> {
  if (result.notifySubmitterApproved) {
    const { submitterId, institutionId, programId, courseId } =
      result.notifySubmitterApproved;

    const params = new URLSearchParams({ institutionId });

    if (programId) {
      params.set("programId", programId);
    }

    if (courseId) {
      params.set("courseId", courseId);
    }

    await createCatalogSubmissionApprovedNotification(
      submitterId,
      result.summary,
      `/pascos/new?${params.toString()}`,
    );
  }

  if (result.notifySubmitterRejected) {
    await createCatalogSubmissionRejectedNotification(
      result.notifySubmitterRejected.submitterId,
      result.notifySubmitterRejected.summary,
      result.notifySubmitterRejected.reason,
    );
  }
}

export function serializeCatalogSubmission(
  submission: CatalogSubmissionWithRelations,
) {
  return {
    id: submission.id,
    type: submission.type as CatalogSubmissionTypeValue,
    status: submission.status as CatalogSubmissionStatusValue,
    institutionId: submission.institutionId,
    institutionName: submission.institution.name,
    submitter: {
      id: submission.submitter.id,
      name: submission.submitter.name,
    },
    reviewer: submission.reviewer
      ? { id: submission.reviewer.id, name: submission.reviewer.name }
      : null,
    programName: submission.programName,
    programType: submission.programType,
    courseCode: submission.courseCode,
    courseTitle: submission.courseTitle,
    programIds: submission.programIds,
    summary: getCatalogSubmissionSummary(submission),
    rejectionReason: submission.rejectionReason,
    approvedProgramId: submission.approvedProgramId,
    approvedCourseId: submission.approvedCourseId,
    reviewedAt: submission.reviewedAt?.toISOString() ?? null,
    createdAt: submission.createdAt.toISOString(),
    updatedAt: submission.updatedAt.toISOString(),
  };
}
