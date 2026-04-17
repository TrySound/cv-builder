import { sql } from "kysely";
import type { DidString } from "@atproto/lex";
import { getDB } from "$lib/db";
import { resolveHandleFromDid } from "$lib/auth";

export const load = async ({ locals }) => {
  const db = await getDB();

  // Count unique users who are either authors or subjects of recommendations
  const result = await sql<{ count: string }>`
    SELECT COUNT(DISTINCT did) AS count FROM (
      SELECT author_did AS did FROM recommendation_index
      UNION
      SELECT subject_did AS did FROM recommendation_index
    )
  `.execute(db);

  const populationCount = Number(result.rows[0]?.count || 0);

  // Get last 4 recommendations
  const lastRecommendations = await db
    .selectFrom("recommendation_index")
    .selectAll()
    .orderBy("created_at", "desc")
    .limit(4)
    .execute();

  // Resolve handles for authors and subjects
  const recommendationsWithHandles = await Promise.all(
    lastRecommendations.map(async (item) => {
      const [authorHandle, subjectHandle] = await Promise.all([
        resolveHandleFromDid(item.author_did as DidString),
        resolveHandleFromDid(item.subject_did as DidString),
      ]);
      return {
        reason: item.reason,
        authorHandle,
        subjectHandle,
      };
    }),
  );

  return {
    handle: locals.handle,
    role: locals.role,
    populationCount,
    lastRecommendations: recommendationsWithHandles,
  };
};
