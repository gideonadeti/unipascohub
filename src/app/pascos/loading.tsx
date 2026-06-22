import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { PascoListSkeleton } from "@/components/pasco-list-skeleton";

export default function BrowsePascosLoading() {
  return (
    <PageContainer width="default" className="space-y-8">
      <PageHeader
        title="Browse pascos"
        description="Filter and discover past exam papers shared by students."
      />
      <PascoListSkeleton count={12} />
    </PageContainer>
  );
}
