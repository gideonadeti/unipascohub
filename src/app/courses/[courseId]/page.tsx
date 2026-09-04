import { notFound, redirect } from "next/navigation";

import { getCourseById } from "@/lib/courses";
import { filtersToSearchParams } from "@/lib/pasco-list-query";

type CourseRouteProps = {
  params: Promise<{ courseId: string }>;
};

export default async function CourseRoute({ params }: CourseRouteProps) {
  const { courseId } = await params;
  const result = await getCourseById(courseId);

  if (!result.success) {
    notFound();
  }

  const query = filtersToSearchParams({ courseId });
  redirect(`/pascos?${query.toString()}`);
}
