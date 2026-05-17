import * as v from "valibot";
import { Agent } from "@atproto/api";
import type { DidString } from "@atproto/lex";
import * as weareonhire from "$lib/lexicons/com/weareonhire";
import * as sifa from "$lib/lexicons/id/sifa";
import { getOAuthClient } from "./auth";
import { getDB } from "./dbkit";
import type { WorkplaceType } from "./jsonresume";
import { applyWrites, getNow } from "./atproto";
import { getWorkplaceType } from "./sifa.server";
import { getContrail } from "./contrail";
import { getSifaWorkplaceType } from "./jsonresume.server";

type ResumeBasicsData = {
  name?: string;
  title?: string;
  email?: string;
  countryCode?: string;
  summary?: string;
  preferredWorkplaces?: WorkplaceType[];
};

export async function loadResumeBasicsData(
  did: DidString,
  isOwnProfile: boolean,
): Promise<
  ResumeBasicsData & {
    languages: { name: string; rkey: string }[];
  }
> {
  const db = await getDB();

  // Load public profile data from records_profile (contrail)
  const [profile, basics] = await Promise.all([
    db
      .selectFrom("records_profile")
      .select((q) => [
        q.ref("record", "->").key("name").as("name"),
        q.ref("record", "->").key("title").as("title"),
        q.ref("record", "->").key("countryCode").as("countryCode"),
      ])
      .where("did", "=", did)
      .executeTakeFirst(),
    db
      .selectFrom("records_basics")
      .select((q) => [
        q.ref("record", "->").key("about").as("about"),
        q
          .ref("record", "->")
          .key("preferredWorkplace")
          .as("preferredWorkplace"),
      ])
      .where("did", "=", did)
      .executeTakeFirst(),
  ]);

  // Load languages from contrail
  const languages = await loadResumeLanguagesData(did);

  const result: ResumeBasicsData & {
    languages: { name: string; rkey: string }[];
  } = {
    name: profile?.name ?? undefined,
    title: profile?.title ?? undefined,
    countryCode: profile?.countryCode ?? undefined,
    summary: basics?.about ?? undefined,
    preferredWorkplaces: basics?.preferredWorkplace
      ?.map((wp) => getWorkplaceType(wp))
      .filter((item) => item !== undefined),
    languages,
  };

  if (isOwnProfile) {
    const profilePrivate = await db
      .selectFrom("profile_private")
      .select(["email", "status"])
      .where("did", "=", did)
      .executeTakeFirst();
    result.email = profilePrivate?.email ?? undefined;
  }

  return result;
}

export async function updateResumeBasicsData(
  did: DidString,
  data: ResumeBasicsData,
) {
  const db = await getDB();

  // Update profile_private table
  await db
    .insertInto("profile_private")
    .values({
      did,
      email: data.email ?? null,
      status: "open_to_connect",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .onConflict((oc) =>
      oc.column("did").doUpdateSet({
        email: data.email ?? null,
        updated_at: new Date().toISOString(),
      }),
    )
    .execute();

  // Create typed client with authenticated session
  const oauthClient = await getOAuthClient();
  const session = await oauthClient.restore(did);
  const agent = new Agent(session);

  // Preserve introduction and creation date
  const [profile, basics] = await Promise.all([
    db
      .selectFrom("records_profile")
      .select((q) => [
        q.ref("record", "->").key("introduction").as("introduction"),
        q.ref("record", "->").key("createdAt").as("createdAt"),
      ])
      .where("did", "=", did)
      .executeTakeFirst(),
    db
      .selectFrom("records_basics")
      .select((q) => q.ref("record", "->").key("createdAt").as("createdAt"))
      .where("did", "=", did)
      .executeTakeFirst(),
  ]);

  // Update com.weareonhire.profile record (preserves introduction)
  const now = getNow();

  const response = await applyWrites(agent, (client) => {
    client.put(weareonhire.profile, {
      name: data.name,
      title: data.title,
      introduction: profile?.introduction,
      countryCode: data.countryCode,
      createdAt: profile?.createdAt ?? now,
    });

    client.put(sifa.profile.self, {
      headline: data.title,
      about: data.summary,
      location: data.countryCode
        ? { countryCode: data.countryCode }
        : undefined,
      preferredWorkplace: data.preferredWorkplaces
        ?.map(getSifaWorkplaceType)
        .filter((item) => item !== undefined),
      createdAt: basics?.createdAt ?? now,
    });
  });
  const contrail = await getContrail();
  await contrail.notify(response.data.affectedUris);
}

/* LANGUAGES */

export const LanguageOperationSchema = v.variant("op", [
  // value is new language name
  v.object({ op: v.literal("add"), value: v.string() }),
  // value is RecordKeyString
  v.object({ op: v.literal("delete"), value: v.string() }),
]);

export type LanguageOperation = v.InferOutput<typeof LanguageOperationSchema>;

// Load resume languages from contrail
export async function loadResumeLanguagesData(did: DidString) {
  const db = await getDB();
  const languages = await db
    .selectFrom("records_language")
    .select((q) => ["rkey", q.ref("record", "->").key("name").as("name")])
    .where("did", "=", did)
    .execute();
  return languages;
}

export async function updateResumeLanguagesData(
  did: DidString,
  operations: LanguageOperation[],
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
          client.create(sifa.profile.language, {
            createdAt: now,
            name: operation.value.trim(),
          });
        }
        if (operation.op === "delete") {
          client.delete(sifa.profile.language, {
            rkey: operation.value,
          });
        }
      }
    });
    const contrail = await getContrail();
    await contrail.notify(response.data.affectedUris);
  }
}

/* SKILLS */

export const SkillOperationSchema = v.variant("op", [
  // value is new skill name
  v.object({ op: v.literal("add"), value: v.string() }),
  // value is RecordKeyString
  v.object({ op: v.literal("delete"), value: v.string() }),
]);

export type SkillOperation = v.InferOutput<typeof SkillOperationSchema>;

// Load resume skills from contrail
export async function loadResumeSkillsData(did: DidString) {
  const db = await getDB();
  const skills = await db
    .selectFrom("records_skill")
    .select((q) => ["rkey", q.ref("record", "->").key("name").as("name")])
    .where("did", "=", did)
    .execute();
  return skills;
}

export async function updateResumeSkillsData(
  did: string,
  operations: SkillOperation[],
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
          client.create(sifa.profile.skill, {
            createdAt: now,
            name: operation.value.trim().toLowerCase(),
          });
        }
        if (operation.op === "delete") {
          client.delete(sifa.profile.skill, {
            rkey: operation.value,
          });
        }
      }
    });
    const contrail = await getContrail();
    await contrail.notify(response.data.affectedUris);
  }
}
