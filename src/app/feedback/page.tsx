import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { ProseContent } from "@/components/layout/prose-content";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { siteLinks } from "@/config/site";

export const metadata: Metadata = {
  title: "Feedback",
  description: "Share feedback, report issues, or leave a testimonial.",
};

export default function FeedbackPage() {
  return (
    <PageContainer width="default">
      <div className="space-y-8">
        <PageHeader
          title="Feedback"
          description="Help us improve Uni Pasco Hub."
        />

        <ProseContent>
          <p>
            The best way to reach the maintainers is through a single feedback
            link. You can configure it by setting{" "}
            <code className="text-foreground">NEXT_PUBLIC_FEEDBACK_URL</code>.
          </p>
        </ProseContent>

        <div>
          {siteLinks.feedback ? (
            <Button asChild>
              <a
                href={siteLinks.feedback}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open feedback link
              </a>
            </Button>
          ) : siteLinks.github ? (
            <Button asChild>
              <a
                href={siteLinks.github}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open GitHub
              </a>
            </Button>
          ) : null}
        </div>

        <div className="space-y-12">
          <div id="feedback">
            <Section
              title="Feedback"
              description="Suggestions, feature requests, and improvements."
            >
              <ProseContent>
                <p>
                  Tell us what would make Uni Pasco Hub more useful for your
                  study workflow. Screenshots and clear steps are always
                  appreciated.
                </p>
              </ProseContent>
            </Section>
          </div>

          <div id="report">
            <Section
              title="Report an issue"
              description="Broken pages, missing files, or unexpected errors."
            >
              <ProseContent>
                <p>
                  If something is broken, include the page URL, what you
                  expected to happen, and what actually happened. If a file
                  cannot be viewed or downloaded, include the pasco ID.
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
                  Testimonials are coming soon. For now, you can leave a note
                  via the feedback link above.
                </p>
              </ProseContent>
            </Section>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
