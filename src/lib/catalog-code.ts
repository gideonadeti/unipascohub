export function normalizeCourseCode(code: string): string {
  return code.trim().replace(/\s+/g, " ");
}
