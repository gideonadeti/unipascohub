import Link from "next/link";
import { Fragment } from "react";

import { ProseContent } from "@/components/layout/prose-content";
import type { Guide } from "@/content/guides/types";

import { cn } from "@/lib/utils";

type GuideContentProps = {
  guide: Guide;
  className?: string;
};

export function GuideContent({ guide, className }: GuideContentProps) {
  return (
    <ProseContent
      className={cn(
        "space-y-8 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5",
        className,
      )}
    >
      {guide.sections.map((section) => (
        <section key={section.title} className="space-y-2">
          <h2>{section.title}</h2>
          {section.paragraphs?.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          {section.bullets ? (
            <ul>
              {section.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          ) : null}
          {section.steps ? (
            <ol>
              {section.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          ) : null}
          {section.links?.length ? (
            <p>
              Related:{" "}
              {section.links.map((link, index) => (
                <Fragment key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                  {index < (section.links?.length ?? 0) - 1 ? " · " : ""}
                </Fragment>
              ))}
            </p>
          ) : null}
        </section>
      ))}
    </ProseContent>
  );
}
