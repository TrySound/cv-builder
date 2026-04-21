import type { DidString } from "@atproto/lex";
import { getDB } from "$lib/db";
import { resolveHandleFromDid } from "$lib/auth";

const truncate = (text: string, limit: number) => {
  if (text.length <= limit) {
    return text;
  }
  return `${text.slice(0, limit)}...`;
};

export const load = async ({ locals }) => {
  const db = await getDB();

  // Load all recommendations from index with author and subject names
  const recommendations = await db
    .selectFrom("recommendation_index")
    .leftJoin("profile_index as author", "author.did", "recommendation_index.author_did")
    .leftJoin("profile_index as subject", "subject.did", "recommendation_index.subject_did")
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
    .limit(50)
    .execute();

  // Resolve handles for all DIDs
  const recommendationsWithHandles = await Promise.all(
    recommendations.map(async (item) => {
      const [authorHandle, subjectHandle] = await Promise.all([
        resolveHandleFromDid(item.author_did as DidString),
        resolveHandleFromDid(item.subject_did as DidString),
      ]);
      return {
        uri: item.uri,
        authorHandle: authorHandle,
        authorName: item.author_name,
        subjectHandle: subjectHandle,
        subjectName: item.subject_name,
        createdAt: item.created_at,
        reason: truncate(item.reason, 200),
      };
    }),
  );

  return {
    handle: locals.handle,
    role: locals.role,
    recommendations: recommendationsWithHandles,
  };
};
