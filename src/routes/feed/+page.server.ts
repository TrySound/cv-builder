import { getDB } from "$lib/dbkit";

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

  // Load all recommendations from records with author and subject names and handles
  const recommendations = await db
    .selectFrom("records_recommendation as rec")
    // join author
    .leftJoin("identities as author_id", "author_id.did", "rec.did")
    .leftJoin("records_profile as author", "author.did", "rec.did")
    // join subject
    .leftJoin("identities as subject_id", (join) =>
      join.onRef("subject_id.did", "=", (query) =>
        query.ref("rec.record", "->>").key("subject"),
      ),
    )
    .leftJoin("records_profile as subject", (join) =>
      join.onRef("subject.did", "=", (query) =>
        query.ref("rec.record", "->>").key("subject"),
      ),
    )
    .orderBy((query) => query.ref("rec.record", "->>").key("createdAt"), "desc")
    .limit(10)
    .select((query) => [
      "rec.uri",
      // author
      "rec.did as author_did",
      "author_id.handle as author_handle",
      query.ref("author.record", "->>").key("name").as("author_name"),
      // subject
      query.ref("rec.record", "->>").key("subject").as("subject_did"),
      "subject_id.handle as subject_handle",
      query.ref("subject.record", "->>").key("name").as("subject_name"),
      query.ref("rec.record", "->>").key("reason").as("reason"),
      query.ref("rec.record", "->>").key("createdAt").as("created_at"),
    ])
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
