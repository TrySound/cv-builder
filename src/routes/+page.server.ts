import { getDB } from "$lib/db";

export const load = async ({ locals }) => {
  const db = await getDB();
  const result = await db
    .selectFrom("members")
    .select(({ fn }) => [fn.count("did").as("count")])
    .executeTakeFirst();

  return {
    handle: locals.handle,
    memberCount: Number(result?.count || 0),
  };
};
