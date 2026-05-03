import { redirect } from "@sveltejs/kit";
import { getDB } from "$lib/db";
import { getAccountData } from "$lib/account.remote";

export const load = async ({ url }) => {
  const account = await getAccountData();
  if (!account) {
    redirect(302, `/?redirect=${encodeURIComponent(url.pathname)}`);
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
    members,
  };
};
