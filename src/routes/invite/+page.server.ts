import { nanoid } from "nanoid";
import { redirect, error } from "@sveltejs/kit";
import { getDB } from "$lib/db";

export const load = async ({ locals }) => {
  if (!locals.did || !locals.handle) {
    redirect(302, "/");
  }

  // Verify user is a member
  const db = await getDB();
  const member = await db
    .selectFrom("members")
    .selectAll()
    .where("did", "=", locals.did)
    .executeTakeFirst();

  if (!member) {
    redirect(302, "/unauthorized");
  }

  // Load user's existing invitations
  const invitations = await db
    .selectFrom("invitations")
    .selectAll()
    .where("created_by", "=", locals.did)
    .orderBy("created_at", "desc")
    .execute();

  return {
    handle: locals.handle,
    member,
    invitations,
  };
};

export const actions = {
  create: async ({ request, locals }) => {
    if (!locals.did) {
      throw error(401, "Not authenticated");
    }

    // Verify user is a member
    const db = await getDB();

    const formData = await request.formData();
    const name = formData.get("name")?.toString().trim() ?? "";
    const recommendationText =
      formData.get("recommendation_text")?.toString().trim() ?? "";

    if (name.length === 0) {
      return { error: "Name is required" };
    }

    if (recommendationText.length < 200) {
      return { error: "Recommendation should be at least 200 characters long" };
    }

    // Generate unique code only across pending invitations
    // Revoked invitations may still have conflicted codes
    let code: undefined | string;
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

    // Create invitation
    const invitation = await db
      .insertInto("invitations")
      .values({
        code,
        name,
        created_by: locals.did,
        recommendation_text: recommendationText,
      })
      .returning(["id", "code"])
      .executeTakeFirst();

    if (!invitation) {
      throw error(500, "Failed to create invitation");
    }

    return {
      success: true,
      inviteUrl: `/invite/${invitation.code}`,
      code: invitation.code,
    };
  },
};
