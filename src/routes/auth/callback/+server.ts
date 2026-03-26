import { redirect } from "@sveltejs/kit";
import { sign } from "cookie-signature";
import { Agent } from "@atproto/api";
import { env } from "$env/dynamic/private";
import { getOAuthClient } from "$lib/auth";
import { getDB } from "$lib/db";

const ALLOWED_DIDS = ["did:plc:ookzzzg4hc3mxf44jkocwiep"];

export const GET = async ({ url, cookies }) => {
  const oauthClient = await getOAuthClient();
  const { session } = await oauthClient.callback(url.searchParams);

  // Check if DID is allowed in the closed community
  if (!ALLOWED_DIDS.includes(session.did)) {
    redirect(302, "/unauthorized");
  }

  const signedSession = sign(session.did, env.SESSION_PASSWORD);

  cookies.set("session", signedSession, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: !env.DEV,
    // 30 days
    maxAge: 60 * 60 * 24 * 30,
  });

  const agent = new Agent(session);
  const profile = await agent.getProfile({ actor: session.did });
  const handle = profile.data.handle;

  // Create or update member record with prefilled data
  const db = await getDB();
  const existingMember = await db
    .selectFrom("members")
    .select("did")
    .where("did", "=", session.did)
    .executeTakeFirst();

  if (!existingMember) {
    // New member - create with prefilled name and bio
    await db
      .insertInto("members")
      .values({
        did: session.did,
        name: profile.data.displayName || null,
        summary: profile.data.description || null,
        headline: null,
        email: null,
        location: null,
        industry: null,
      })
      .execute();
  }

  redirect(302, `/profile/${handle}`);
};
