import { error } from "@sveltejs/kit";
import { getDB } from "$lib/db";

export const load = async ({ params, locals }) => {
  const { code } = params;

  const db = await getDB();

  const invitation = await db
    .selectFrom("invitations")
    .innerJoin("members", "invitations.created_by", "members.did")
    .select([
      "invitations.id",
      "invitations.code",
      "invitations.name",
      "invitations.recommendation_text",
      "invitations.created_at",
      "members.did as inviter_did",
      "members.handle as inviter_handle",
      "members.name as inviter_name",
    ])
    .where("invitations.code", "=", code)
    .whereRef("invitations.used_count", "<", "invitations.max_uses")
    .executeTakeFirst();

  if (!invitation) {
    throw error(404, "Invitation not found");
  }

  let hasAlreadyRecommended = false;
  if (locals.did) {
    const existingRecommendation = await db
      .selectFrom("recommendations")
      .select("id")
      .where("author_did", "=", invitation.inviter_did)
      .where("subject_did", "=", locals.did)
      .executeTakeFirst();
    hasAlreadyRecommended = existingRecommendation !== undefined;
  }

  return {
    handle: locals.handle,
    inviteCode: code,
    invitation: {
      id: invitation.id,
      code: invitation.code,
      name: invitation.name,
      recommendationText: invitation.recommendation_text,
      createdAt: invitation.created_at,
      invitedBy: {
        handle: invitation.inviter_handle,
        name: invitation.inviter_name,
      },
    },
    hasAlreadyRecommended,
  };
};

export const actions = {
  accept: async ({ params, locals }) => {
    const { code } = params;

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

    if (locals.did) {
      const currentUser = locals.did;
      // Accept recommendation as already a member
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
    }
  },
};
