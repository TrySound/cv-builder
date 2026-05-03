import * as v from "valibot";
import { error } from "@sveltejs/kit";
import { query, command, form } from "$app/server";
import { ResumeSchema } from "./jsonresume";
import { getDB } from "./db";
import {
  loadResume,
  loadResumeBasicsData,
  loadResumeSkillsData,
  LanguageOperationSchema,
  SkillOperationSchema,
  updateResume,
  updateResumeBasicsData,
  updateResumeLanguagesData,
  updateResumeSkillsData,
} from "./resume.server";
import { loadSifaResume, updateSifaResume } from "./sifa.server";
import {
  loadProfile,
  loadProfileContacts,
  updateProfileContacts,
  updateProfileData,
} from "./profile.server";
import { resolveIdentifier } from "./atproto";
import { getAccountData } from "./account.remote";

const ContactOperationSchema = v.variant("op", [
  // value is new contact url
  v.object({ op: v.literal("add"), value: v.string() }),
  // value is RecordKeyString
  v.object({ op: v.literal("delete"), value: v.string() }),
]);

export const getProfile = query(
  v.object({ handle: v.string() }),
  async ({ handle }) => {
    const resolved = await resolveIdentifier(handle);
    if (!resolved) {
      error(404, `Cannot resolve ${handle}`);
    }
    const profile = await loadProfile(resolved.did);
    return profile;
  },
);

export const getResumeBasics = query(
  v.object({ handle: v.string() }),
  async ({ handle }) => {
    const resolved = await resolveIdentifier(handle);
    if (!resolved) {
      error(404, `Cannot resolve ${handle}`);
    }
    const basics = await loadResumeBasicsData(resolved.did);
    return basics;
  },
);

export const getProfilePrivateData = query(
  v.object({ handle: v.string() }),
  async ({ handle }) => {
    const account = await getAccountData();
    const resolved = await resolveIdentifier(handle);
    if (!resolved) {
      error(404, `Cannot resolve ${handle}`);
    }
    const db = await getDB();
    if (account?.did === resolved.did) {
      const profilePrivate = await db
        .selectFrom("profile_private")
        .select(["email", "status"])
        .where("did", "=", resolved.did)
        .executeTakeFirst();
      return {
        email: profilePrivate?.email ?? undefined,
        status: profilePrivate?.status ?? undefined,
      };
    }
  },
);

export const getProfileContacts = query(
  v.object({ handle: v.string() }),
  async ({ handle }) => {
    const resolved = await resolveIdentifier(handle);
    if (!resolved) {
      error(404, `Cannot resolve ${handle}`);
    }
    const contacts = await loadProfileContacts(resolved.did);
    return {
      contacts,
    };
  },
);

export const getResumeSkills = query(
  v.object({ handle: v.string() }),
  async ({ handle }) => {
    const resolved = await resolveIdentifier(handle);
    if (!resolved) {
      error(404, `Cannot resolve ${handle}`);
    }
    const skills = await loadResumeSkillsData(resolved.did);
    return {
      skills,
    };
  },
);

const ProfileSchema = v.object({
  name: v.optional(v.string()),
  title: v.optional(v.string()),
  introduction: v.optional(v.string()),
  countryCode: v.optional(v.string()),
  email: v.optional(v.string()),
  status: v.optional(
    v.union([
      v.literal("open_to_work"),
      v.literal("open_to_connect"),
      v.literal("hidden"),
    ]),
  ),
  contactOperations: v.optional(v.array(ContactOperationSchema)),
});

export const updateProfile = form(
  ProfileSchema,
  async ({
    name,
    title,
    introduction,
    countryCode,
    email,
    status,
    contactOperations,
  }) => {
    const account = await getAccountData();

    if (!account) {
      error(401, "Unauthorized");
    }

    // Update profile data in database and AT Protocol
    await updateProfileData(account.did, {
      name,
      title,
      introduction,
      countryCode,
      email,
      status,
    });

    // Update contacts in SIFA external accounts using atomic operations
    await updateProfileContacts(account.did, contactOperations ?? []);

    getProfile({ handle: account.handle }).set({
      name,
      title,
      introduction,
      countryCode,
    });
    getProfilePrivateData({ handle: account.handle }).set({
      email,
      status,
    });
    getProfileContacts({ handle: account.handle }).refresh();
  },
);

const ResumeBasicsSchema = v.object({
  name: v.optional(v.string()),
  title: v.optional(v.string()),
  email: v.optional(v.string()),
  countryCode: v.optional(v.string()),
  summary: v.optional(v.string()),
  preferredWorkplaces: v.optional(
    v.array(
      v.union([v.literal("onsite"), v.literal("remote"), v.literal("hybrid")]),
    ),
  ),
  contactOperations: v.optional(v.array(ContactOperationSchema)),
  languageOperations: v.optional(v.array(LanguageOperationSchema)),
});

export const updateResumeBasics = form(
  ResumeBasicsSchema,
  async ({
    name,
    title,
    email,
    countryCode,
    summary,
    preferredWorkplaces,
    contactOperations,
    languageOperations,
  }) => {
    const account = await getAccountData();
    if (!account) {
      error(401, "Unauthorized");
    }

    await updateResumeBasicsData(account.did, {
      name,
      title,
      email,
      countryCode,
      summary,
      preferredWorkplaces,
    });
    await updateProfileContacts(account.did, contactOperations ?? []);
    await updateResumeLanguagesData(account.did, languageOperations ?? []);

    // cannot use set because languages should be refreshed
    getResumeBasics({ handle: account.handle }).refresh();
    getProfilePrivateData({ handle: account.handle }).refresh();
    getProfileContacts({ handle: account.handle }).refresh();
  },
);

const SkillsUpdateSchema = v.object({
  skillOperations: v.array(SkillOperationSchema),
});

export const updateResumeSkills = form(
  SkillsUpdateSchema,
  async ({ skillOperations }) => {
    const account = await getAccountData();
    if (!account) {
      error(401, "Unauthorized");
    }
    await updateResumeSkillsData(account.did, skillOperations);
    getResumeSkills({ handle: account.handle }).refresh();
  },
);

// Legacy functions for resume page
export const getMemberProfile = query(
  v.object({ handle: v.string() }),
  async ({ handle }) => {
    const resolved = await resolveIdentifier(handle);
    if (!resolved) {
      error(404, `Cannot resolve ${handle}`);
    }
    const account = await getAccountData();
    // show local resume and fallback to sifa resume
    const isProfileOwner = account?.did === resolved.did;
    return (
      (await loadResume(resolved.did)) ??
      (await loadSifaResume(resolved.did, isProfileOwner))
    );
  },
);

export const updateMemberProfile = command(ResumeSchema, async (resume) => {
  const account = await getAccountData();
  if (!account) {
    error(401, "Unauthorized");
  }

  // Check if user is a member (exists in local database)
  const db = await getDB();
  const member = await db
    .selectFrom("members")
    .select("did")
    .where("did", "=", account.did)
    .executeTakeFirst();

  // update legacy members (only work, education, projects, skills, languages)
  if (member) {
    await updateResume(account.did, resume);
  }
  // update atproto + private data (only work, education, projects, skills, languages)
  await updateSifaResume(account.did, resume);

  // Refresh the profile query to reflect changes
  getMemberProfile({ handle: account.handle }).refresh();
});
