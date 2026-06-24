export type FeedbackCategory =
  | "BUG_REPORT"
  | "CONTENT_ISSUE"
  | "FEATURE_REQUEST"
  | "GENERAL"
  | "TESTIMONIAL";

export type CreateFeedbackRequest = {
  category: FeedbackCategory;
  subject: string;
  message: string;
  contactEmail?: string;
  pageUrl?: string;
  pascoId?: string;
};

export type CreateFeedbackResponse = {
  feedback: {
    id: string;
  };
};

export type FeedbackStatus = "NEW" | "READ" | "ARCHIVED";

export type FeedbackItem = {
  id: string;
  category: FeedbackCategory;
  subject: string;
  message: string;
  contactEmail: string | null;
  pageUrl: string | null;
  pascoId: string | null;
  status: FeedbackStatus;
  userName: string | null;
  createdAt: string;
};

export type ListFeedbackRequest = {
  status?: FeedbackStatus;
  category?: FeedbackCategory;
  page?: number;
  limit?: number;
};

export type ListFeedbackResponse = {
  feedback: FeedbackItem[];
  totalCount: number;
  page: number;
  limit: number;
};

export type UpdateFeedbackStatusRequest = {
  status: FeedbackStatus;
};

export type UpdateFeedbackStatusResponse = {
  feedback: FeedbackItem;
};
