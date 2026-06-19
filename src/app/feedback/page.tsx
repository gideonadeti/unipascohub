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
  const hasFeedbackForm = Boolean(siteLinks.feedback);

  return (
    <PageContainer width="default">
      <div className="space-y-8">
        <PageHeader
          title="Feedback"
          description="Help us improve Uni Pasco Hub."
        />

        <ProseContent>
          {hasFeedbackForm ? (
            <p>
              Use the form below to share suggestions, report issues, or leave a
              testimonial. Screenshots and clear steps help us fix problems
              faster.
            </p>
          ) : (
            <p>
              The feedback form is not available right now. You can still reach
              the maintainers through the link below.
            </p>
          )}
        </ProseContent>

        <div>
          {siteLinks.feedback ? (
            <Button asChild>
              <a
                href={siteLinks.feedback}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open feedback form
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
                  cannot be viewed or downloaded, include the pasco ID. You can
                  attach screenshots in the form.
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
                  A few sentences about how past papers helped you prepare is
                  enough. Share yours through the form above.
                </p>
              </ProseContent>
            </Section>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
