import { PascoCardSkeleton } from "@/components/pasco-card-skeleton";

const SKELETON_KEYS = [
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
] as const;

type PascoListSkeletonProps = {
  count?: number;
};

export function PascoListSkeleton({ count = 6 }: PascoListSkeletonProps) {
  return (
    <div
      aria-busy="true"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      <span className="sr-only">Loading pascos…</span>
      {SKELETON_KEYS.slice(0, count).map((key) => (
        <PascoCardSkeleton key={key} />
      ))}
    </div>
  );
}
