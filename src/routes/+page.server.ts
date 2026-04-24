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
      UNION
      SELECT did FROM profile_index
    )
  `.execute(db);

  const populationCount = Number(result.rows[0]?.count || 0);

  // Get last 4 recommendations with author and subject names
  const lastRecommendations = await db
    .selectFrom("recommendation_index")
    .leftJoin(
      "profile_index as author",
      "author.did",
      "recommendation_index.author_did",
    )
    .leftJoin(
      "profile_index as subject",
      "subject.did",
      "recommendation_index.subject_did",
    )
    .select([
      "recommendation_index.uri",
      "recommendation_index.author_did",
      "recommendation_index.subject_did",
      "recommendation_index.reason",
      "recommendation_index.created_at",
      "author.name as author_name",
      "subject.name as subject_name",
    ])
    .orderBy("recommendation_index.created_at", "desc")
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
        authorName: item.author_name,
        subjectHandle,
        subjectName: item.subject_name,
      };
    }),
  );

  return {
    handle: locals.handle,
    role: locals.role,
    populationCount,
    lastRecommendations:
      Array.from(Array(6)).map(() => ({
        reason:
          "recommedation text recommedation text recommedation text recommedation text recommedation text recommedation text recommedation text recommedation text recommedation text",
        authorHandle: "handle2",
        subjectHandle: "handl2",
      })) ?? recommendationsWithHandles,
  };
};
