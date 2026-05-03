import { error } from "@sveltejs/kit";
import { query } from "$app/server";
import { getDB } from "$lib/db";
import { getAccountData } from "$lib/account.remote";

export const getChecks = query(async () => {
  const account = await getAccountData();
  if (!account) {
    error(401);
  }
  const db = await getDB();

  // Verify user is a member
  const member = await db
    .selectFrom("members")
    .select(["did", "invited_by"])
    .where("did", "=", account.did)
    .executeTakeFirst();
  if (!member) {
    error(401);
  }

  // Check if user has uploaded resume (has positions)
  const positionsCount = await db
    .selectFrom("member_positions")
    .select((eb) => eb.fn.count("id").as("count"))
    .where("did", "=", account.did)
    .executeTakeFirst()
    .then((result) => Number.parseInt(result?.count?.toString() ?? "0", 10));
  const hasResume = positionsCount > 0;

  // Check if user has sent recommendation back to inviter
  let hasRecommendedBack = true;
  if (member.invited_by) {
    const recommendation = await db
      .selectFrom("recommendations")
      .select("id")
      .where("author_did", "=", account.did)
      .where("subject_did", "=", member.invited_by)
      .executeTakeFirst();
    hasRecommendedBack = recommendation !== undefined;
  }

  // Check if user has sent at least one invite
  const invitesCount = await db
    .selectFrom("invitations")
    .select((eb) => eb.fn.count("id").as("count"))
    .where("created_by", "=", account.did)
    .executeTakeFirst()
    .then((result) => parseInt(result?.count?.toString() ?? "0", 10));
  const hasInvited = invitesCount > 0;

  return {
    hasResume,
    hasRecommendedBack,
    hasInvited,
  };
});
