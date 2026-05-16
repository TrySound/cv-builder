import * as v from "valibot";
import type { DidString } from "@atproto/lex";
import { Agent } from "@atproto/api";
import * as weareonhire from "$lib/lexicons/com/weareonhire";
import * as sifa from "$lib/lexicons/id/sifa";
import { getOAuthClient } from "./auth";
import { getDB } from "./dbkit";
import { normalizeUrl } from "./link";
import { applyWrites, getNow } from "./atproto";
import { getContrail } from "./contrail";

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

  // Load public profile data from weareonhire profile
  const profile = await db
    .selectFrom("records_profile")
    .select((query) => [
      query.ref("record", "->>").key("name").as("name"),
      query.ref("record", "->>").key("title").as("title"),
      query.ref("record", "->>").key("introduction").as("introduction"),
      query.ref("record", "->>").key("countryCode").as("country_code"),
    ])
    .where("did", "=", did)
    .executeTakeFirst();

  const result: ProfileData = {
    name: profile?.name,
    title: profile?.title,
    introduction: profile?.introduction,
    countryCode: profile?.country_code,
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

  // Update profile_private table
  await db
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

  // Create typed client with authenticated session
  const oauthClient = await getOAuthClient();
  const session = await oauthClient.restore(did);
  const agent = new Agent(session);

  // Preserve summary and creation date
  const [profile, basics] = await Promise.all([
    db
      .selectFrom("records_profile")
      .select((q) => q.ref("record", "->>").key("createdAt").as("createdAt"))
      .where("did", "=", did)
      .executeTakeFirst(),
    db
      .selectFrom("records_basics")
      .select((q) => [
        q.ref("record", "->>").key("about").as("about"),
        q.ref("record", "->>").key("createdAt").as("createdAt"),
      ])
      .where("did", "=", did)
      .executeTakeFirst(),
  ]);

  // Update com.weareonhire.profile record
  const now = getNow();
  const response = await applyWrites(agent, (client) => {
    client.put(weareonhire.profile, {
      name: data.name,
      title: data.title,
      introduction: data.introduction,
      countryCode: data.countryCode,
      createdAt: profile?.createdAt ?? now,
    });
    client.put(sifa.profile.self, {
      headline: data.title,
      about: basics?.about,
      location: data.countryCode
        ? { countryCode: data.countryCode }
        : undefined,
      createdAt: basics?.createdAt ?? now,
    });
  });
  const contrail = await getContrail();
  await contrail.notify(response.data.affectedUris);
}

/* CONTACTS */

export const ContactOperationSchema = v.variant("op", [
  // value is new contact url
  v.object({ op: v.literal("add"), value: v.string() }),
  // value is RecordKeyString
  v.object({ op: v.literal("delete"), value: v.string() }),
]);

export type ContactOperation = v.InferOutput<typeof ContactOperationSchema>;

// Load profile contacts from SIFA external accounts
export async function loadProfileContacts(did: DidString) {
  const db = await getDB();
  const contacts = await db
    .selectFrom("records_account")
    .select((query) => [
      "rkey",
      query.ref("record", "->>").key("url").as("url"),
    ])
    .where("did", "=", did)
    .execute();
  return contacts;
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
    const response = await applyWrites(agent, (client) => {
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
    const contrail = await getContrail();
    await contrail.notify(response.data.affectedUris);
  }
}
