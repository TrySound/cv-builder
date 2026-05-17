import { redirect } from "@sveltejs/kit";
import { sign } from "cookie-signature";
import { Agent } from "@atproto/api";
import { Client, type DidString } from "@atproto/lex";
import { env } from "$env/dynamic/private";
import { getOAuthClient } from "$lib/auth";
import { getDB } from "$lib/dbkit";
import * as weareonhire from "$lib/lexicons/com/weareonhire";
import { getNow } from "$lib/atproto";
import { getContrail } from "$lib/contrail";
import { migrateLegacyResume } from "$lib/legacy-resume.server";

/**
 * Ensure weareonhire profile exists for the user.
 * Creates profile from sifa/bsky data if it doesn't exist.
 * Also migrates legacy member_* data if present.
 */
async function ensureProfile(
  db: Awaited<ReturnType<typeof getDB>>,
  client: Client,
  did: DidString,
  bskyDisplayName: string | undefined,
  bskyDescription: string | undefined,
) {
  await migrateLegacyResume(db, did);

  const [existingProfile, basics] = await Promise.all([
    await db
      .selectFrom("records_profile")
      .where("did", "=", did)
      .select("did")
      .executeTakeFirst(),
    db
      .selectFrom("records_basics")
      .where("did", "=", did)
      .select((q) => [
        q.ref("record", "->").key("headline").as("headline"),
        q.ref("record", "->").key("about").as("about"),
        q.ref("record", "->").key("location").as("location"),
      ])
      .executeTakeFirst(),
  ]);
  // skip populating initial data if profile already exists
  if (existingProfile) {
    return;
  }

  // Create the profile record
  const now = getNow();
  const updatedProfile = await client.put(weareonhire.profile, {
    name: bskyDisplayName,
    title: basics?.headline,
    countryCode: basics?.location?.countryCode,
    introduction: basics?.about ?? bskyDescription,
    createdAt: now,
  });
  const contrail = await getContrail();
  contrail.notify(updatedProfile.uri);

  await db
    .insertInto("profile_private")
    .values({
      did,
      email: null,
      status: "open_to_connect",
      created_at: now,
    })
    .onConflict((oc) => oc.column("did").doNothing())
    .execute();
}

export const GET = async ({ url, cookies }) => {
  const oauthClient = await getOAuthClient();

  let session;
  try {
    const result = await oauthClient.callback(url.searchParams);
    session = result.session;
  } catch (error) {
    console.error("OAuth callback error:", error);
    redirect(302, "/unauthorized");
  }

  const agent = new Agent(session);
  const client = new Client(agent);
  const profile = await agent.getProfile({ actor: session.did });
  const handle = profile.data.handle;

  const db = await getDB();

  // Ensure user has weareonhire profile and private record
  // Also migrate legacy member_* data if present
  await ensureProfile(
    db,
    client,
    session.did,
    profile.data.displayName,
    profile.data.description,
  );

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

  const redirectUrl = cookies.get("redirect");
  cookies.delete("redirect", { path: "/" });
  redirect(302, redirectUrl || `/profile/${handle}`);
};
