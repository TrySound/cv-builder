import { getDB } from "$lib/db";

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

export const load = async ({ locals }) => {
  const db = await getDB();

  // Load all recommendations from index with author and subject names and handles
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
    .leftJoin(
      "handle_index as author_handle",
      "author_handle.did",
      "recommendation_index.author_did",
    )
    .leftJoin(
      "handle_index as subject_handle",
      "subject_handle.did",
      "recommendation_index.subject_did",
    )
    .select([
      "recommendation_index.uri",
      "recommendation_index.author_did",
      "recommendation_index.subject_did",
      "recommendation_index.reason",
      "recommendation_index.created_at",
      "author.name as author_name",
      "author_handle.handle as author_handle",
      "subject.name as subject_name",
      "subject_handle.handle as subject_handle",
    ])
    .orderBy("recommendation_index.created_at", "desc")
    .limit(50)
    .execute();

  // Load newly joined users from profile_index with handles
  const newUsers = await db
    .selectFrom("profile_index")
    .leftJoin("handle_index", "handle_index.did", "profile_index.did")
    .select([
      "profile_index.did",
      "profile_index.name",
      "profile_index.introduction",
      "profile_index.created_at",
      "handle_index.handle",
    ])
    .orderBy("profile_index.created_at", "desc")
    .limit(50)
    .execute();

  // Use handle from DB or fallback to DID
  const recommendationItems: FeedRecommendation[] = recommendations.map(
    (item) => ({
      type: "recommendation",
      uri: item.uri,
      authorHandle: item.author_handle ?? item.author_did,
      authorName: item.author_name,
      subjectHandle: item.subject_handle ?? item.subject_did,
      subjectName: item.subject_name,
      createdAt: item.created_at,
      reason: truncate(item.reason, 200),
    }),
  );

  const userItems: FeedUser[] = newUsers.map((item) => ({
    type: "user",
    did: item.did,
    handle: item.handle ?? item.did,
    name: item.name,
    createdAt: item.created_at,
    introduction: item.introduction ? truncate(item.introduction, 200) : null,
  }));

  // Combine and sort by created_at desc, limit to 50
  const feed: FeedItem[] = [...recommendationItems, ...userItems]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 50);

  return {
    handle: locals.handle,
    role: locals.role,
    feed,
  };
};
