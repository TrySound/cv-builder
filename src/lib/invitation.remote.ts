import { nanoid } from "nanoid";
import * as v from "valibot";
import { error, redirect } from "@sveltejs/kit";
import { query, form } from "$app/server";
import { getDB } from "./db";
import { getAccountData } from "./account.remote";

export const getMyInvitations = query(async () => {
  const account = await getAccountData();
  if (!account) {
    error(401);
  }
  const db = await getDB();
  const invitations = await db
    .selectFrom("invitations")
    .selectAll()
    .where("created_by", "=", account.did)
    .whereRef("invitations.used_count", "<", "invitations.max_uses")
    .orderBy("created_at", "desc")
    .execute();
  return invitations;
});

export const createInvitation = form(
  v.object({
    name: v.pipe(v.string(), v.nonEmpty()),
    recommendation_text: v.pipe(
      v.string(),
      v.minLength(200, "Recommendation should be at least 200 characters long"),
    ),
  }),
  async ({ name, recommendation_text }) => {
    const account = await getAccountData();
    if (!account) {
      error(401);
    }

    const db = await getDB();

    let code;
    let attempts = 0;
    while (attempts < 10) {
      code = nanoid(8);
      const existing = await db
        .selectFrom("invitations")
        .select("id")
        .where("code", "=", code)
        .whereRef("invitations.used_count", "<", "invitations.max_uses")
        .executeTakeFirst();
      if (!existing) {
        break;
      }
      attempts++;
    }

    if (!code || attempts >= 10) {
      throw error(500, "Failed to generate unique invite code");
    }

    await db
      .insertInto("invitations")
      .values({
        code,
        name,
        created_by: account.did,
        recommendation_text: recommendation_text,
      })
      .execute();

    getMyInvitations().refresh();
  },
);

export const acceptInvitation = form(
  v.object({
    code: v.pipe(v.string(), v.nonEmpty()),
  }),
  async ({ code }) => {
    const account = await getAccountData();
    if (!account) {
      error(401);
    }

    const db = await getDB();

    const invitation = await db
      .selectFrom("invitations")
      .selectAll()
      .where("code", "=", code)
      .whereRef("invitations.used_count", "<", "invitations.max_uses")
      .executeTakeFirst();
    if (!invitation) {
      throw error(404, "Invitation not found");
    }

    const currentUser = account.did;

    await db.transaction().execute(async (trx) => {
      await trx
        .insertInto("recommendations")
        .values({
          author_did: invitation.created_by,
          subject_did: currentUser,
          text: invitation.recommendation_text,
          invitation_id: invitation.id,
        })
        .execute();

      await trx
        .updateTable("invitations")
        .set((exp) => ({
          used_count: exp("used_count", "+", 1),
        }))
        .where("id", "=", invitation.id)
        .execute();
    });

    redirect(302, `/profile/${account.handle}`);
  },
);
