import { format } from "date-fns/format";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import { isValid } from "date-fns/isValid";
import { parseISO } from "date-fns/parseISO";

function parseIsoDate(iso: string): Date | null {
  const date = parseISO(iso);
  return isValid(date) ? date : null;
}

/** Relative label for cards, e.g. "3 days ago" */
export function formatRelativeDate(iso: string): string {
  const date = parseIsoDate(iso);

  if (!date) {
    return iso;
  }

  return formatDistanceToNow(date, { addSuffix: true });
}

/** Absolute label for detail views, e.g. "Jun 19, 2026, 2:30 PM" */
export function formatDateTime(iso: string): string {
  const date = parseIsoDate(iso);

  if (!date) {
    return iso;
  }

  return format(date, "PPp");
}
