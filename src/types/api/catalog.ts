export type ProgramType =
  | "BACHELOR"
  | "BTECH"
  | "BTECH_TOP_UP"
  | "HND"
  | "DIPLOMA";

export type Institution = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type InstitutionListResponse = {
  institutions: Institution[];
};

export type InstitutionDetailResponse = {
  institution: Institution;
};

export type Program = {
  id: string;
  institutionId: string;
  name: string;
  type: ProgramType;
  label: string;
  createdAt: string;
  updatedAt: string;
};

export type ProgramListFilters = {
  institutionId?: string;
};

export type ProgramListResponse = {
  programs: Program[];
};

export type ProgramDetailResponse = {
  program: Program;
};

export type Course = {
  id: string;
  institutionId: string;
  title: string;
  code: string;
  createdAt: string;
  updatedAt: string;
};

export type CourseDetail = Course & {
  programIds: string[];
};

export type CourseListFilters = {
  institutionId?: string;
  programId?: string;
};

export type CourseListResponse = {
  courses: Course[];
};

export type CourseDetailResponse = {
  course: CourseDetail;
};
