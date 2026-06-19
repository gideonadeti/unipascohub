import { siteLinks } from "@/config/site";

function readEntryKey(value: string | undefined): string | undefined {
  const trimmed = value?.trim();

  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

const prefillEntries = {
  pascoId: readEntryKey(process.env.NEXT_PUBLIC_FEEDBACK_FORM_ENTRY_PASCO_ID),
  pageUrl: readEntryKey(process.env.NEXT_PUBLIC_FEEDBACK_FORM_ENTRY_PAGE_URL),
  category: readEntryKey(process.env.NEXT_PUBLIC_FEEDBACK_FORM_ENTRY_CATEGORY),
  message: readEntryKey(process.env.NEXT_PUBLIC_FEEDBACK_FORM_ENTRY_MESSAGE),
} as const;

const prefillCategoryReport =
  process.env.NEXT_PUBLIC_FEEDBACK_FORM_CATEGORY_REPORT?.trim() ||
  process.env.NEXT_PUBLIC_FEEDBACK_FORM_CATEGORY_BUG?.trim() ||
  "Report";

const prefillReportMessage =
  process.env.NEXT_PUBLIC_FEEDBACK_FORM_MESSAGE_REPORT?.trim() ||
  "Please describe what is wrong with this pasco:";

export type FeedbackFormPrefill = {
  pascoId?: string;
  pageUrl?: string;
  message?: string;
  preselectReport?: boolean;
  /** @deprecated Use preselectReport */
  preselectBug?: boolean;
};

export function buildFeedbackFormUrl(
  prefill?: FeedbackFormPrefill,
): string | null {
  const base = siteLinks.feedback;

  if (!base) {
    return null;
  }

  let url: URL;

  try {
    url = new URL(base);
  } catch {
    return base;
  }

  if (prefill?.pascoId && prefillEntries.pascoId) {
    url.searchParams.set(prefillEntries.pascoId, prefill.pascoId);
  }

  if (prefill?.pageUrl && prefillEntries.pageUrl) {
    url.searchParams.set(prefillEntries.pageUrl, prefill.pageUrl);
  }

  if (prefill?.message && prefillEntries.message) {
    url.searchParams.set(prefillEntries.message, prefill.message);
  }

  const shouldPreselectReport =
    prefill?.preselectReport ?? prefill?.preselectBug ?? false;

  if (shouldPreselectReport && prefillEntries.category) {
    url.searchParams.set(prefillEntries.category, prefillCategoryReport);
  }

  return url.toString();
}

export function getPascoReportFormPrefill(
  pascoId: string,
  pageUrl?: string,
): FeedbackFormPrefill {
  return {
    pascoId,
    pageUrl,
    message: prefillReportMessage,
    preselectReport: true,
  };
}

export function buildPascoReportHref(
  pascoId: string,
  pageUrl: string,
): string | null {
  return buildFeedbackFormUrl(getPascoReportFormPrefill(pascoId, pageUrl));
}
