import { prisma } from "@/lib/db";

export function displayName(firstName: string | null, lastName: string | null) {
  const name = `${firstName ?? ""} ${lastName ?? ""}`.trim();

  return name || "User";
}

export async function upsertUserFromClerk({
  clerkId,
  firstName,
  lastName,
}: {
  clerkId: string;
  firstName: string | null;
  lastName: string | null;
}) {
  const name = displayName(firstName, lastName);

  return prisma.user.upsert({
    where: { clerkId },
    create: { clerkId, name },
    update: { name },
  });
}

export async function deleteUserByClerkId(clerkId: string) {
  return prisma.user.deleteMany({ where: { clerkId } });
}
