import { PageContainer } from "@/components/layout/page-container";
import { PascoDetailSkeleton } from "@/components/pasco-detail-skeleton";

export default function PascoDetailLoading() {
  return (
    <PageContainer width="narrow" className="space-y-8">
      <PascoDetailSkeleton />
    </PageContainer>
  );
}
