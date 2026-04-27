import * as v from "valibot";
import { Client, type DidString } from "@atproto/lex";
import { Agent } from "@atproto/api";
import * as weareonhire from "$lib/lexicons/com/weareonhire";
import * as sifa from "$lib/lexicons/id/sifa";
import { getOAuthClient } from "./auth";
import { getDB } from "./db";
import { normalizeUrl } from "./link";
import { applyWrites, getNow, getPdsClient, getRkey } from "./atproto";

export interface ProfileData {
  name: string | undefined;
  title: string | undefined;
  introduction: string | undefined;
  countryCode: string | undefined;
  email?: string | undefined;
  status?: "open_to_work" | "open_to_connect" | "hidden" | undefined;
}

export async function loadProfile(
  did: DidString,
  isOwnProfile: boolean,
): Promise<ProfileData> {
  const db = await getDB();

  // Load public profile data from profile_index
  const profileIndex = await db
    .selectFrom("profile_index")
    .select(["name", "title", "introduction", "country_code"])
    .where("did", "=", did)
    .executeTakeFirst();

  const result: ProfileData = {
    name: profileIndex?.name ?? undefined,
    title: profileIndex?.title ?? undefined,
    introduction: profileIndex?.introduction ?? undefined,
    countryCode: profileIndex?.country_code ?? undefined,
  };

  if (isOwnProfile) {
    const profilePrivate = await db
      .selectFrom("profile_private")
      .select(["email", "status"])
      .where("did", "=", did)
      .executeTakeFirst();
    result.email = profilePrivate?.email ?? undefined;
    result.status = profilePrivate?.status ?? undefined;
  }

  return result;
}

export async function updateProfileData(
  did: DidString,
  data: {
    name?: string;
    title?: string;
    introduction?: string;
    countryCode?: string;
    email?: string;
    status?: "open_to_work" | "open_to_connect" | "hidden";
  },
): Promise<void> {
  const db = await getDB();

  await db.transaction().execute(async (trx) => {
    // Update profile_index table
    await trx
      .insertInto("profile_index")
      .values({
        did,
        name: data.name ?? null,
        title: data.title ?? null,
        introduction: data.introduction ?? null,
        country_code: data.countryCode ?? null,
        created_at: getNow(),
      })
      .onConflict((oc) =>
        oc.column("did").doUpdateSet({
          name: data.name ?? null,
          title: data.title ?? null,
          introduction: data.introduction ?? null,
          country_code: data.countryCode ?? null,
        }),
      )
      .execute();

    // Update profile_private table
    await trx
      .insertInto("profile_private")
      .values({
        did,
        email: data.email ?? null,
        status: data.status ?? "hidden",
        created_at: getNow(),
        updated_at: getNow(),
      })
      .onConflict((oc) =>
        oc.column("did").doUpdateSet({
          email: data.email ?? null,
          status: data.status ?? "hidden",
          updated_at: getNow(),
        }),
      )
      .execute();
  });

  // Create typed client with authenticated session
  const oauthClient = await getOAuthClient();
  const session = await oauthClient.restore(did);
  const client = new Client(new Agent(session));

  // Get current sifa profile to preserve summary
  let currentSummary: string | undefined;
  try {
    const existingProfile = await client.get(sifa.profile.self.main, {
      rkey: "self",
      repo: did,
    });
    currentSummary = existingProfile.value.about;
  } catch {
    // Profile doesn't exist yet
  }

  // Update com.weareonhire.profile record
  const now = getNow();
  await client.put(weareonhire.profile.main, {
    createdAt: now,
    name: data.name,
    title: data.title,
    introduction: data.introduction,
    countryCode: data.countryCode,
  });
  await client.put(sifa.profile.self.main, {
    createdAt: now,
    headline: data.title,
    about: currentSummary,
    location: data.countryCode ? { countryCode: data.countryCode } : undefined,
  });
}

export const ContactOperationSchema = v.variant("op", [
  // value is new contact url
  v.object({ op: v.literal("add"), value: v.string() }),
  // value is RecordKeyString
  v.object({ op: v.literal("delete"), value: v.string() }),
]);

export type ContactOperation = v.InferOutput<typeof ContactOperationSchema>;

// Load profile contacts from SIFA external accounts
export async function loadProfileContacts(did: DidString) {
  const client = await getPdsClient(did);
  const externalAccountsResponse = await client
    .list(sifa.profile.externalAccount, {
      repo: did,
      limit: 100,
    })
    .catch((error) => {
      console.error("Error loading external accounts:", error);
    });
  const contacts = externalAccountsResponse?.records?.map((record) => {
    const value = sifa.profile.externalAccount.main.$cast(record.value);
    return {
      url: value.url as string,
      rkey: getRkey(record.uri),
    };
  });
  return contacts ?? [];
}

export async function updateProfileContacts(
  did: string,
  operations: ContactOperation[],
) {
  // Create typed client with authenticated session
  const oauthClient = await getOAuthClient();
  const session = await oauthClient.restore(did);
  const agent = new Agent(session);
  const now = getNow();
  if (operations.length > 0) {
    await applyWrites(agent, (client) => {
      for (const operation of operations) {
        if (operation.op === "add") {
          client.create(sifa.profile.externalAccount, {
            createdAt: now,
            url: normalizeUrl(operation.value.trim()) as `${string}:${string}`,
            platform: "id.sifa.defs#platformOther",
          });
        }
        if (operation.op === "delete") {
          client.delete(sifa.profile.externalAccount, {
            rkey: operation.value,
          });
        }
      }
    });
  }
}
