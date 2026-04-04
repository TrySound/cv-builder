import { redirect } from "@sveltejs/kit";
import { getDB } from "$lib/db";

export const load = async ({ locals }) => {
  if (!locals.did || !locals.handle) {
    redirect(302, "/");
  }

  const db = await getDB();

  // Verify user is a member
  const member = await db
    .selectFrom("members")
    .select(["did", "invited_by"])
    .where("did", "=", locals.did)
    .executeTakeFirst();

  if (!member) {
    redirect(302, "/unauthorized");
  }

  // Get inviter info if user was invited
  let inviter = null;
  if (member.invited_by) {
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
    handle: locals.handle,
    inviter,
  };
};
