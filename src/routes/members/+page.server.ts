import { redirect } from "@sveltejs/kit";
import { getDB } from "$lib/db";

export const load = async ({ locals, url }) => {
  if (!locals.did) {
    redirect(302, `/?redirect=${encodeURIComponent(url.pathname)}`);
  }

  // Only members can access this page
  if (locals.role !== "member") {
    redirect(302, "/unauthorized");
  }

  const db = await getDB();

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
    role: locals.role,
    members,
  };
};
