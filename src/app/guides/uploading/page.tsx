import type { Metadata } from "next";

import { GuideContent } from "@/components/layout/guide-content";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { uploadingGuide } from "@/content/guides/uploading";

export const metadata: Metadata = {
  title: "How to upload",
  description: uploadingGuide.description,
};

export default function UploadingGuidePage() {
  return (
    <PageContainer width="narrow">
      <div className="space-y-8">
        <PageHeader
          title={uploadingGuide.title}
          description={uploadingGuide.description}
        />
        <GuideContent guide={uploadingGuide} />
      </div>
    </PageContainer>
  );
}
