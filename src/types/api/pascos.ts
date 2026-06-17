export type EducationLevel =
  | "LEVEL_100"
  | "LEVEL_200"
  | "LEVEL_300"
  | "LEVEL_400";

export type SemesterType = "FIRST_SEMESTER" | "SECOND_SEMESTER";

export type PascoType = "MID_SEM" | "END_OF_SEM" | "RESIT";

export type PascoContentType =
  | "QUESTIONS_ONLY"
  | "QUESTIONS_AND_ANSWERS"
  | "ANSWERS_ONLY";

export type SolutionCompleteness = "FULLY_SOLVED" | "PARTIALLY_SOLVED";

export type CloudinaryResourceType = "IMAGE" | "RAW";

export type PascoReactionType = "LIKE" | "DISLIKE";

export type PascoListSortBy =
  | "createdAt"
  | "updatedAt"
  | "academicYear"
  | "likeCount"
  | "dislikeCount"
  | "downloadCount"
  | "viewCount";

export type PascoListSortOrder = "asc" | "desc";

export type PascoListFilters = {
  courseId?: string;
  educationLevel?: EducationLevel;
  academicYear?: string;
  semesterType?: SemesterType;
  type?: PascoType;
  contentType?: PascoContentType;
  isComplete?: boolean;
  page?: number;
  limit?: number;
  sortBy?: PascoListSortBy;
  sortOrder?: PascoListSortOrder;
};

export type PascoFile = {
  id: string;
  pascoId: string;
  order: number;
  fileName: string;
  fileSize: number;
  fileUrl: string;
  resourceType: CloudinaryResourceType;
  createdAt: string;
  updatedAt: string;
};

export type Pasco = {
  id: string;
  courseId: string;
  uploaderId: string;
  academicYear: string;
  description: string | null;
  educationLevel: EducationLevel;
  semesterType: SemesterType;
  type: PascoType;
  contentType: PascoContentType;
  solutionCompleteness: SolutionCompleteness | null;
  isComplete: boolean;
  likeCount: number;
  dislikeCount: number;
  downloadCount: number;
  viewCount: number;
  files: PascoFile[];
  createdAt: string;
  updatedAt: string;
  viewerReaction?: PascoReactionType | null;
};

export type PascoListResponse = {
  pascos: Pasco[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type PascoDetailResponse = {
  pasco: Pasco;
};

export type PascoFileCreateInput = {
  order: number;
  publicId: string;
  fileName: string;
  fileSize: number;
  fileUrl: string;
  resourceType: CloudinaryResourceType;
  contentHash: string;
};

export type PascoFileComputeHashInput = {
  courseId: string;
  publicId: string;
  fileName: string;
  fileSize: number;
  fileUrl: string;
  resourceType: CloudinaryResourceType;
};

export type PascoFileComputeHashResponse = {
  contentHash: string;
};

export type PascoFileDuplicate = {
  contentHash: string;
  fileName: string;
  pascoId: string;
};

export type PascoFileDuplicateCheckResponse = {
  duplicates: PascoFileDuplicate[];
  message?: string;
};

export type PascoCreateDuplicateErrorResponse = {
  error: "duplicate_file_content";
  message: string;
  duplicates: PascoFileDuplicate[];
};

export type PascoCreateInput = {
  courseId: string;
  files: PascoFileCreateInput[];
  academicYear: string;
  description?: string;
  educationLevel: EducationLevel;
  semesterType: SemesterType;
  type: PascoType;
  contentType: PascoContentType;
  solutionCompleteness?: SolutionCompleteness | null;
  isComplete?: boolean;
};

export type PascoCreateResponse = {
  pasco: Pasco;
};

export type PascoFileExistingSyncInput = {
  id: string;
  order: number;
};

export type PascoFileSyncInput =
  | PascoFileCreateInput
  | PascoFileExistingSyncInput;

export type PascoUpdateInput = {
  courseId?: string;
  academicYear?: string;
  description?: string | null;
  educationLevel?: EducationLevel;
  semesterType?: SemesterType;
  type?: PascoType;
  contentType?: PascoContentType;
  solutionCompleteness?: SolutionCompleteness | null;
  isComplete?: boolean;
  files?: PascoFileSyncInput[];
};

export type PascoUpdateResponse = {
  pasco: Pasco;
  storageCleanupFailures?: string[];
};
