import { prisma } from "@/lib/db";

export function displayName(firstName: string | null, lastName: string | null) {
  const name = `${firstName ?? ""} ${lastName ?? ""}`.trim();

  return name || "User";
}

export async function upsertUserFromClerk({
  id,
  firstName,
  lastName,
}: {
  id: string;
  firstName: string | null;
  lastName: string | null;
}) {
  const name = displayName(firstName, lastName);

  return prisma.user.upsert({
    where: { id },
    create: { id, name },
    update: { name },
  });
}

export async function deleteUserById(id: string) {
  return prisma.user.deleteMany({ where: { id } });
}
