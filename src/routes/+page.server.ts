import { getDB } from "$lib/dbkit";

export const load = async ({ locals }) => {
  const db = await getDB();

  // Get last 4 recommendations with author names and handles
  const lastRecommendations = await db
    .selectFrom("records_recommendation as rec")
    .leftJoin("records_profile as author", "author.did", "rec.did")
    .leftJoin("identities as author_id", "author_id.did", "rec.did")
    .orderBy((query) => query.ref("rec.record", "->>").key("createdAt"), "desc")
    .select((query) => [
      "rec.uri",
      "rec.did as author_did",
      "author_id.handle as author_handle",
      query.ref("author.record", "->").key("name").as("author_name"),
      query.ref("rec.record", "->").key("reason").as("reason"),
      query.ref("rec.record", "->").key("createdAt").as("created_at"),
    ])
    .limit(4)
    .execute();

  // Use handle from DB or fallback to DID
  const recommendationsWithHandles = lastRecommendations.map((item) => {
    return {
      reason: item.reason,
      authorHandle: item.author_handle ?? item.author_did,
      authorName: item.author_name,
    };
  });

  return {
    handle: locals.handle,
    role: locals.role,
    lastRecommendations: recommendationsWithHandles,
  };
};
