import { redirect } from "@sveltejs/kit";
import { sign } from "cookie-signature";
import { Agent } from "@atproto/api";
import { env } from "$env/dynamic/private";
import { getOAuthClient } from "$lib/auth";
import { getDB } from "$lib/db";

const ALLOWED_HANDLES = ["trysound.io"];

export const GET = async ({ url, cookies }) => {
  const oauthClient = await getOAuthClient();
  const { session } = await oauthClient.callback(url.searchParams);

  const agent = new Agent(session);
  const profile = await agent.getProfile({ actor: session.did });
  const handle = profile.data.handle;

  const db = await getDB();

  // Check for invite code in cookie
  const inviteCode = cookies.get("invite_code");

  // Check if user is already a member
  const existingMember = await db
    .selectFrom("members")
    .select("did")
    .where("did", "=", session.did)
    .executeTakeFirst();

  let invitation;
  let inviteExpired = false;
  if (inviteCode) {
    invitation = await db
      .selectFrom("invitations")
      .selectAll()
      .where("code", "=", inviteCode)
      // make sure invitation is valid
      .whereRef("used_count", "<", "max_uses")
      .executeTakeFirst();

    // Check if invitation exists but is expired
    if (!invitation) {
      const expiredInvite = await db
        .selectFrom("invitations")
        .selectAll()
        .where("code", "=", inviteCode)
        .whereRef("used_count", ">=", "max_uses")
        .executeTakeFirst();
      if (expiredInvite) {
        inviteExpired = true;
      }
    }
  }

  // If not a member and no invite code, check whitelist
  if (!existingMember && !invitation && !ALLOWED_HANDLES.includes(handle)) {
    cookies.delete("session", { path: "/" });
    // Redirect back to invite page with error if invite code exists
    if (inviteCode) {
      const errorParam = inviteExpired ? "invite_expired" : "not_invited";
      redirect(302, `/invite/${inviteCode}?error=${errorParam}`);
    }
    redirect(302, "/unauthorized");
  }

  // Store session cookie
  const sessionData = JSON.stringify({ did: session.did, handle });
  const signedSession = sign(sessionData, env.SESSION_PASSWORD);
  cookies.set("session", signedSession, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: !env.DEV,
    // 30 days
    maxAge: 60 * 60 * 24 * 30,
  });

  // create member for hardcoded handle (founder)
  if (ALLOWED_HANDLES.includes(handle) && !existingMember) {
    await db
      .insertInto("members")
      .values({
        did: session.did,
        handle,
        name: profile.data.displayName,
        summary: profile.data.description,
        // invited by themselves
        invited_by: session.did,
      })
      .execute();
  }

  // New member joining via invitation
  else if (invitation && !existingMember) {
    await db.transaction().execute(async (trx) => {
      await trx
        .insertInto("members")
        .values({
          did: session.did,
          handle,
          name: profile.data.displayName,
          summary: profile.data.description,
          invited_by: invitation.created_by,
        })
        .execute();
      await trx
        .insertInto("recommendations")
        .values({
          author_did: invitation.created_by,
          subject_did: session.did,
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

  // create recommendation for already added member
  else if (invitation && existingMember) {
    const existingRecommendation = await db
      .selectFrom("recommendations")
      .select("id")
      .where("author_did", "=", invitation.created_by)
      .where("subject_did", "=", session.did)
      .executeTakeFirst();
    // prevent accepting invitation from yourself
    // and accepting multiple recommendations from the same author
    if (invitation.created_by !== session.did && !existingRecommendation) {
      await db.transaction().execute(async (trx) => {
        await trx
          .insertInto("recommendations")
          .values({
            author_did: invitation.created_by,
            subject_did: session.did,
            text: invitation.recommendation_text,
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
  }

  // Update handle in case it changed for existing members
  else if (existingMember) {
    await db
      .updateTable("members")
      .set({ handle })
      .where("did", "=", session.did)
      .execute();
  }

  // Clean up invite code cookie
  cookies.delete("invite_code", { path: "/" });

  redirect(302, `/profile/${handle}`);
};
