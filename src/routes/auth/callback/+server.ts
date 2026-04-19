import { redirect } from "@sveltejs/kit";
import { sign } from "cookie-signature";
import { Agent } from "@atproto/api";
import { Client, type DatetimeString, type DidString } from "@atproto/lex";
import { env } from "$env/dynamic/private";
import { getOAuthClient } from "$lib/auth";
import { getDB } from "$lib/db";
import * as weareonhire from "$lib/lexicons/com/weareonhire";
import * as sifa from "$lib/lexicons/id/sifa";

/**
 * Ensure weareonhire profile exists for the user.
 * Creates profile from sifa/bsky data if it doesn't exist.
 */
async function ensureProfile(
  db: Awaited<ReturnType<typeof getDB>>,
  client: Client,
  did: DidString,
  bskyDisplayName: string | undefined,
  bskyDescription: string | undefined,
) {
  // Check if profile already exists in atproto
  const existingProfile = await client
    .get(weareonhire.profile.main, {
      rkey: "self",
      repo: did,
    })
    .catch(() => undefined);
  if (existingProfile) {
    // Profile already exists, don't override
    return;
  }

  // Fetch sifa profile data
  const sifaResponse = await client
    .get(sifa.profile.self.main, {
      rkey: "self",
      repo: did,
    })
    .catch(() => undefined);

  const sifaProfile = sifaResponse?.value;

  // Build profile data from sifa/bsky
  const name = bskyDisplayName ?? null;
  const title = sifaProfile?.headline ?? null;
  const introduction = sifaProfile?.about ?? bskyDescription ?? null;
  const countryCode = sifaProfile?.location?.countryCode ?? null;

  // Create the profile record
  const now = new Date().toISOString() as DatetimeString;
  await client.put(weareonhire.profile.main, {
    name: name ?? undefined,
    title: title ?? undefined,
    countryCode: countryCode ?? undefined,
    introduction: introduction ?? undefined,
    createdAt: now,
  });

  await db
    .insertInto("profile_index")
    .values({
      did,
      name: name,
      title: title,
      country_code: countryCode,
      introduction: introduction,
      created_at: now,
    })
    .onConflict((oc) => oc.column("did").doNothing())
    .execute();
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

  redirect(302, `/profile/${handle}`);
};
