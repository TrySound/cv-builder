import type { DidString } from "@atproto/lex";
import { getDB } from "$lib/db";
import { resolveHandleFromDid } from "$lib/auth";

const truncate = (text: string, limit: number) => {
  if (text.length <= limit) {
    return text;
  }
  return `${text.slice(0, limit)}...`;
};

export type FeedRecommendation = {
  type: "recommendation";
  uri: string;
  authorHandle: string;
  authorName: string | null;
  subjectHandle: string;
  subjectName: string | null;
  createdAt: string;
  reason: string;
};

export type FeedUser = {
  type: "user";
  did: string;
  handle: string;
  name: string | null;
  createdAt: string;
  introduction: string | null;
};

export type FeedItem = FeedRecommendation | FeedUser;

export const load = async () => {
  const db = await getDB();

  // Load all recommendations from index with author and subject names
  const recommendations = await db
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
    .limit(50)
    .execute();

  // Load newly joined users from profile_index
  const newUsers = await db
    .selectFrom("profile_index")
    .select(["did", "name", "introduction", "created_at"])
    .orderBy("created_at", "desc")
    .limit(50)
    .execute();

  // Resolve handles and build feed items
  const [recommendationItems, userItems] = await Promise.all([
    Promise.all(
      recommendations.map(async (item): Promise<FeedRecommendation> => {
        const [authorHandle, subjectHandle] = await Promise.all([
          resolveHandleFromDid(item.author_did as DidString),
          resolveHandleFromDid(item.subject_did as DidString),
        ]);
        return {
          type: "recommendation",
          uri: item.uri,
          authorHandle: authorHandle,
          authorName: item.author_name,
          subjectHandle: subjectHandle,
          subjectName: item.subject_name,
          createdAt: item.created_at,
          reason: truncate(item.reason, 200),
        };
      }),
    ),
    Promise.all(
      newUsers.map(async (item): Promise<FeedUser> => {
        const handle = await resolveHandleFromDid(item.did as DidString);
        return {
          type: "user",
          did: item.did,
          handle: handle,
          name: item.name,
          createdAt: item.created_at,
          introduction: item.introduction
            ? truncate(item.introduction, 200)
            : null,
        };
      }),
    ),
  ]);

  // Combine and sort by created_at desc, limit to 50
  const feed: FeedItem[] = [...recommendationItems, ...userItems]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 50);

  return {
    feed,
  };
};
