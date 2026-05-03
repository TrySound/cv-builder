import { redirect } from "@sveltejs/kit";
import { getDB } from "$lib/db";
import { getAccountData } from "$lib/account.remote";

export const load = async ({ url }) => {
  const account = await getAccountData();
  if (!account) {
    redirect(302, `/?redirect=${encodeURIComponent(url.pathname)}`);
  }

  const db = await getDB();

  // Get member info for inviter details
  const member = await db
    .selectFrom("members")
    .select(["did", "invited_by"])
    .where("did", "=", account.did)
    .executeTakeFirst();

  // Get inviter info if user was invited
  let inviter = null;
  if (member?.invited_by) {
    const inviterData = await db
      .selectFrom("members")
      .select(["name", "handle"])
      .where("did", "=", member.invited_by)
      .executeTakeFirst();

    if (inviterData) {
      inviter = {
        name: inviterData.name,
        handle: inviterData.handle,
      };
    }
  }

  return {
    inviter,
  };
};
