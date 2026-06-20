import type { PascoReactionType } from "@/types/api/pascos";

export function getNextReaction(
  current: PascoReactionType | null | undefined,
  target: PascoReactionType,
): PascoReactionType | null {
  return current === target ? null : target;
}
