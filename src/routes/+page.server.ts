import { sql } from "kysely";
import { getDB } from "$lib/db";
import { timeAsync, getCurrentRequestId } from "$lib/profiling";

export const load = async ({ locals }) => {
  const requestId = getCurrentRequestId(locals);
  const db = await timeAsync(requestId, "home.getDB", () => getDB());

  // Count unique users who are either authors or subjects of recommendations
  const result = await timeAsync(
    requestId,
    "home.query.populationCount",
    () =>
      sql<{ count: string }>`
        SELECT COUNT(DISTINCT did) AS count FROM (
          SELECT author_did AS did FROM recommendation_index
          UNION
          SELECT subject_did AS did FROM recommendation_index
          UNION
          SELECT did FROM profile_index
        )
      `.execute(db),
  );

  const populationCount = Number(result.rows[0]?.count || 0);

  // Get last 4 recommendations with author names and handles
  const lastRecommendations = await timeAsync(
    requestId,
    "home.query.lastRecommendations",
    () =>
      db
        .selectFrom("recommendation_index")
        .leftJoin(
          "profile_index as author",
          "author.did",
          "recommendation_index.author_did",
        )
        .leftJoin(
          "handle_index as author_handle",
          "author_handle.did",
          "recommendation_index.author_did",
        )
        .select([
          "recommendation_index.uri",
          "recommendation_index.author_did",
          "recommendation_index.reason",
          "recommendation_index.created_at",
          "author.name as author_name",
          "author_handle.handle as author_handle",
        ])
        .orderBy("recommendation_index.created_at", "desc")
        .limit(4)
        .execute(),
  );

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
    populationCount,
    lastRecommendations: recommendationsWithHandles,
  };
};
