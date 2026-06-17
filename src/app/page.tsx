import { PageContainer } from "@/components/layout/page-container";
import { PascoListSection } from "@/components/pasco-list-section";

export default function HomePage() {
  return (
    <PageContainer width="default" className="space-y-8">
      <PascoListSection
        title="Recent pascos"
        filters={{ sortBy: "createdAt", sortOrder: "desc", limit: 6 }}
        emptyAction={{ label: "Upload a pasco", href: "/pascos/new" }}
      />
    </PageContainer>
  );
}
