import { auth, currentUser } from "@clerk/nextjs/server";

import { upsertUserFromClerk } from "@/lib/user-sync";

export async function EnsureUserSynced() {
  const { userId } = await auth();
  if (!userId) {
    return null;
  }

  const user = await currentUser();

  if (!user) {
    return null;
  }

  await upsertUserFromClerk({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
  });

  return null;
}
