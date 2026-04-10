import { redirect } from "@sveltejs/kit";
import type { HandleString } from "@atproto/lex";
import { getDB } from "$lib/db";

export const load = async ({ params, locals }) => {
  const profileHandle = params.handle as HandleString;
  const db = await getDB();
  const profileMember = await db
    .selectFrom("members")
    .select("did")
    .where("handle", "=", profileHandle)
    .executeTakeFirst();

  return {
    handle: locals.handle,
    profile: {
      role: profileMember ? ("member" as const) : ("public" as const),
      handle: profileHandle,
    },
  };
};
