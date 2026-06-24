import type { ProgramType } from "@/types/api/catalog";

export type CatalogSubmissionType = "PROGRAM" | "COURSE";

export type CatalogSubmissionStatus = "PENDING" | "APPROVED" | "REJECTED";

export type CatalogSubmission = {
  id: string;
  type: CatalogSubmissionType;
  status: CatalogSubmissionStatus;
  institutionId: string;
  institutionName: string;
  submitter: {
    id: string;
    name: string;
  };
  reviewer: {
    id: string;
    name: string;
  } | null;
  programName: string | null;
  programType: ProgramType | null;
  courseCode: string | null;
  courseTitle: string | null;
  programIds: string[];
  summary: string;
  rejectionReason: string | null;
  approvedProgramId: string | null;
  approvedCourseId: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CatalogProgramSubmissionCreateRequest = {
  type: "PROGRAM";
  institutionId: string;
  programName: string;
  programType: ProgramType;
};

export type CatalogCourseSubmissionCreateRequest = {
  type: "COURSE";
  institutionId: string;
  courseCode: string;
  courseTitle: string;
  programIds?: string[];
};

export type CatalogSubmissionCreateRequest =
  | CatalogProgramSubmissionCreateRequest
  | CatalogCourseSubmissionCreateRequest;

export type CatalogSubmissionCreateResponse = {
  submission: CatalogSubmission;
};

export type CatalogSubmissionListFilters = {
  institutionId?: string;
  status?: CatalogSubmissionStatus;
};

export type CatalogSubmissionListResponse = {
  submissions: CatalogSubmission[];
};

export type ModerationCatalogSubmissionListFilters = {
  status?: CatalogSubmissionStatus;
  page?: number;
  limit?: number;
};

export type ModerationCatalogSubmissionListResponse = {
  submissions: CatalogSubmission[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type ModerationCatalogSubmissionAction = "approve" | "reject";

export type ModerationCatalogSubmissionUpdateRequest = {
  action: ModerationCatalogSubmissionAction;
  reason?: string;
};

export type ModerationCatalogSubmissionUpdateResponse = {
  status: CatalogSubmissionStatus;
};

export type CatalogSubmissionUpdateRequest = {
  programName?: string;
  programType?: ProgramType;
  courseCode?: string;
  courseTitle?: string;
};

export type CatalogSubmissionUpdateResponse = {
  status: CatalogSubmissionStatus;
};
