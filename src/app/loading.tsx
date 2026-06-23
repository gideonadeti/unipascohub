import { PageContainer } from "@/components/layout/page-container";
import { Spinner } from "@/components/ui/spinner";

export default function LoadingPage() {
  return (
    <PageContainer width="default" className="space-y-8">
      <div className="flex items-center justify-center py-32">
        <Spinner aria-label="Loading" />
      </div>
    </PageContainer>
  );
}
