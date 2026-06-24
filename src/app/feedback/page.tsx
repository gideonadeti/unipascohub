import type { Metadata } from "next";

import { FeedbackForm } from "@/components/feedback-form";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { ProseContent } from "@/components/layout/prose-content";
import { Section } from "@/components/layout/section";

export const metadata: Metadata = {
  title: "Feedback",
  description: "Share feedback, report issues, or leave a testimonial.",
};

export default function FeedbackPage() {
  return (
    <PageContainer width="narrow">
      <div className="space-y-8">
        <PageHeader
          title="Feedback"
          description="Help us improve Uni Pasco Hub."
        />

        <div id="feedback">
          <Section
            title="Send your feedback"
            description="Suggestions, feature requests, bug reports, or testimonials."
          >
            <ProseContent>
              <p>
                Use the form below to share your thoughts. If you are reporting
                a problem with a specific pasco, use the Report button on its
                detail page instead.
              </p>
            </ProseContent>
            <div className="mt-6 rounded-lg border p-6">
              <FeedbackForm />
            </div>
          </Section>
        </div>

        <div id="report">
          <Section
            title="Report an issue"
            description="Broken pages, missing files, or unexpected errors."
          >
            <ProseContent>
              <p>
                If something is broken, include the page URL, what you expected
                to happen, and what actually happened. You can also report
                issues directly from the pasco detail page using the Report
                button.
              </p>
            </ProseContent>
          </Section>
        </div>

        <div id="testimonials">
          <Section
            title="Testimonials"
            description="Short stories about how pascos helped you prepare."
          >
            <ProseContent>
              <p>
                Select "Testimonial" from the category dropdown above and share
                a few sentences about how past papers helped you prepare.
              </p>
            </ProseContent>
          </Section>
        </div>
      </div>
    </PageContainer>
  );
}
