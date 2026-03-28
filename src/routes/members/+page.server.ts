import { redirect } from "@sveltejs/kit";
import { getDB } from "$lib/db";

export const load = async ({ locals }) => {
  if (!locals.did) {
    redirect(302, "/login");
  }

  const db = await getDB();

  // Verify current user is a member
  const currentMember = await db
    .selectFrom("members")
    .select("did")
    .where("did", "=", locals.did)
    .executeTakeFirst();

  if (!currentMember) {
    redirect(302, "/unauthorized");
  }

  // Load all members with inviter info
  const members = await db
    .selectFrom("members as m")
    .leftJoin("members as inviter", "m.invited_by", "inviter.did")
    .select([
      "m.did",
      "m.handle",
      "m.name",
      "m.headline",
      "m.created_at",
      "inviter.name as inviter_name",
      "inviter.handle as inviter_handle",
    ])
    .orderBy("m.created_at", "desc")
    .execute();

  return {
    handle: locals.handle,
    members,
  };
};
