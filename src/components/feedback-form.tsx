"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useCreateFeedback } from "@/hooks/api/use-feedback";
import { formatEnumLabel } from "@/lib/catalog-labels";
import type { FeedbackCategory } from "@/types/api/feedback";

const CATEGORY_OPTIONS: FeedbackCategory[] = [
  "BUG_REPORT",
  "CONTENT_ISSUE",
  "FEATURE_REQUEST",
  "GENERAL",
  "TESTIMONIAL",
];

type FeedbackFormProps = {
  onSuccess?: () => void;
  initialValues?: {
    category?: FeedbackCategory;
    pascoId?: string;
    pageUrl?: string;
  };
  showCategorySelector?: boolean;
};

export function FeedbackForm({
  onSuccess,
  initialValues,
  showCategorySelector = true,
}: FeedbackFormProps) {
  const [category, setCategory] = useState<FeedbackCategory>(
    initialValues?.category ?? "GENERAL",
  );
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const createFeedback = useCreateFeedback();

  function handleSubmit() {
    if (!subject.trim() || !message.trim()) {
      return;
    }

    createFeedback.mutate(
      {
        category,
        subject: subject.trim(),
        message: message.trim(),
        contactEmail: contactEmail.trim() || undefined,
        pascoId: initialValues?.pascoId,
        pageUrl: initialValues?.pageUrl,
      },
      {
        onSuccess: () => {
          setSubject("");
          setMessage("");
          setContactEmail("");
          if (!initialValues?.category) {
            setCategory("GENERAL");
          }
          onSuccess?.();
        },
      },
    );
  }

  return (
    <div className="space-y-4">
      {showCategorySelector ? (
        <div className="space-y-2">
          <Label htmlFor="feedback-category">Category</Label>
          <Select
            value={category}
            onValueChange={(value) => setCategory(value as FeedbackCategory)}
          >
            <SelectTrigger id="feedback-category" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_OPTIONS.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {formatEnumLabel(cat)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="feedback-subject">Subject</Label>
        <Input
          id="feedback-subject"
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          placeholder={
            initialValues?.pascoId
              ? "What's wrong with this pasco?"
              : "Brief summary of your feedback"
          }
          maxLength={200}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="feedback-message">Message</Label>
        <Textarea
          id="feedback-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder={
            category === "BUG_REPORT"
              ? "What did you expect to happen and what actually happened?"
              : category === "CONTENT_ISSUE"
                ? "Please describe the issue with this pasco."
                : category === "FEATURE_REQUEST"
                  ? "What feature would you like to see?"
                  : category === "TESTIMONIAL"
                    ? "Share your story — how have past questions helped you?"
                    : "Tell us what's on your mind."
          }
          rows={4}
          maxLength={5000}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="feedback-email">
          Email <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="feedback-email"
          type="email"
          value={contactEmail}
          onChange={(event) => setContactEmail(event.target.value)}
          placeholder="If you'd like us to follow up"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          disabled={
            createFeedback.isPending || !subject.trim() || !message.trim()
          }
          onClick={handleSubmit}
        >
          {createFeedback.isPending ? <Spinner aria-hidden /> : null}
          Submit feedback
        </Button>
      </div>
    </div>
  );
}
