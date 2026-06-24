import { z } from "zod";

import { prisma } from "@/lib/db";
import {
  FeedbackCategory,
  type FeedbackCategory as FeedbackCategoryType,
} from "../../generated/prisma/enums";
import type { FeedbackWhereInput } from "../../generated/prisma/models/Feedback";

const FEEDBACK_CATEGORIES = new Set<string>(Object.values(FeedbackCategory));

export const createFeedbackSchema = z.object({
  category: z.string().refine((val) => FEEDBACK_CATEGORIES.has(val), {
    message: "Invalid feedback category",
  }),
  subject: z.string().min(1, "Subject is required").max(200),
  message: z.string().min(1, "Message is required").max(5000),
  contactEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  pageUrl: z.string().max(2000).optional().or(z.literal("")),
  pascoId: z.string().optional().or(z.literal("")),
});

export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema> & {
  userId?: string;
};

const FEEDBACK_STATUSES = new Set(["NEW", "READ", "ARCHIVED"]);

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

type FeedbackRow = {
  id: string;
  category: string;
  subject: string;
  message: string;
  contactEmail: string | null;
  pageUrl: string | null;
  pascoId: string | null;
  status: string;
  createdAt: Date;
  user: { name: string } | null;
};

export function serializeFeedback(row: FeedbackRow) {
  return {
    id: row.id,
    category: row.category as FeedbackCategoryType,
    subject: row.subject,
    message: row.message,
    contactEmail: row.contactEmail,
    pageUrl: row.pageUrl,
    pascoId: row.pascoId,
    status: row.status,
    userName: row.user?.name ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export type ListFeedbackFilters = {
  status?: string;
  category?: string;
  page?: number;
  limit?: number;
};

export async function listFeedback(filters: ListFeedbackFilters = {}) {
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, filters.limit ?? DEFAULT_PAGE_SIZE),
  );
  const skip = (page - 1) * limit;

  const where: FeedbackWhereInput = {};

  if (filters.status && FEEDBACK_STATUSES.has(filters.status)) {
    where.status = filters.status;
  }

  if (filters.category && FEEDBACK_CATEGORIES.has(filters.category)) {
    where.category = filters.category as FeedbackCategoryType;
  }

  const [rows, totalCount] = await Promise.all([
    prisma.feedback.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        category: true,
        subject: true,
        message: true,
        contactEmail: true,
        pageUrl: true,
        pascoId: true,
        status: true,
        createdAt: true,
        user: { select: { name: true } },
      },
    }),
    prisma.feedback.count({ where }),
  ]);

  return {
    feedback: rows.map(serializeFeedback),
    totalCount,
    page,
    limit,
  };
}

export async function updateFeedbackStatus(feedbackId: string, status: string) {
  if (!FEEDBACK_STATUSES.has(status)) {
    throw new Error("Invalid status");
  }

  const updated = await prisma.feedback.update({
    where: { id: feedbackId },
    data: { status },
    select: {
      id: true,
      category: true,
      subject: true,
      message: true,
      contactEmail: true,
      pageUrl: true,
      pascoId: true,
      status: true,
      createdAt: true,
      user: { select: { name: true } },
    },
  });

  return { feedback: serializeFeedback(updated) };
}

export async function createFeedback(input: CreateFeedbackInput) {
  const parsed = createFeedbackSchema.parse(input);

  const feedback = await prisma.feedback.create({
    data: {
      userId: input.userId ?? null,
      category: parsed.category as FeedbackCategory,
      subject: parsed.subject,
      message: parsed.message,
      contactEmail: parsed.contactEmail || null,
      pageUrl: parsed.pageUrl || null,
      pascoId: parsed.pascoId || null,
    },
    select: { id: true },
  });

  return { feedback: { id: feedback.id } };
}
