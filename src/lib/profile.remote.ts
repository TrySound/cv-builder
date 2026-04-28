import * as v from "valibot";
import { error } from "@sveltejs/kit";
import { query, command, form, getRequestEvent } from "$app/server";
import type { DidString } from "@atproto/lex";
import { ResumeSchema } from "./jsonresume";
import { getDB } from "./db";
import {
  loadResume,
  loadResumeBasicsData,
  updateResume,
  updateResumeBasicsData,
} from "./resume.server";
import { loadSifaResume, updateSifaResume } from "./sifa.server";
import {
  loadProfile,
  loadProfileContacts,
  updateProfileContacts,
  updateProfileData,
} from "./profile.server";
import { resolveIdentifier } from "./atproto";

const ContactOperationSchema = v.variant("op", [
  // value is new contact url
  v.object({ op: v.literal("add"), value: v.string() }),
  // value is RecordKeyString
  v.object({ op: v.literal("delete"), value: v.string() }),
]);

export const getProfile = query(
  v.object({ handle: v.string() }),
  async ({ handle }) => {
    const event = getRequestEvent();
    const resolved = await resolveIdentifier(handle);
    if (!resolved) {
      error(404, `Cannot resolve ${handle}`);
    }
    const isOwnProfile = event.locals.did === resolved.did;
    const profile = await loadProfile(resolved.did, isOwnProfile);
    return profile;
  },
);

export const getResumeBasics = query(
  v.object({ handle: v.string() }),
  async ({ handle }) => {
    const event = getRequestEvent();
    const resolved = await resolveIdentifier(handle);
    if (!resolved) {
      error(404, `Cannot resolve ${handle}`);
    }
    const isOwnProfile = event.locals.did === resolved.did;
    const basics = await loadResumeBasicsData(resolved.did, isOwnProfile);
    return basics;
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
    const event = getRequestEvent();
    const did = event.locals.did as undefined | DidString;
    const handle = event.locals.handle;

    if (!did || !handle) {
      error(401, "Unauthorized");
    }

    // Update profile data in database and AT Protocol
    await updateProfileData(did, {
      name,
      title,
      introduction,
      countryCode,
      email,
      status,
    });

    // Update contacts in SIFA external accounts using atomic operations
    await updateProfileContacts(did, contactOperations ?? []);

    getProfile({ handle }).set({
      name,
      title,
      introduction,
      countryCode,
      email,
      status,
    });
    getProfileContacts({ handle }).refresh();
  },
);

const ResumeBasicsSchema = v.object({
  name: v.optional(v.string()),
  title: v.optional(v.string()),
  email: v.optional(v.string()),
  countryCode: v.optional(v.string()),
  summary: v.optional(v.string()),
  contactOperations: v.optional(v.array(ContactOperationSchema)),
});

export const updateResumeBasics = form(
  ResumeBasicsSchema,
  async ({ name, title, email, countryCode, summary, contactOperations }) => {
    const event = getRequestEvent();
    const did = event.locals.did as DidString;
    const handle = event.locals.handle;

    if (!did || !handle) {
      error(401, "Unauthorized");
    }

    // Update resume basics data (preserves weareonhire introduction)
    await updateResumeBasicsData(did as DidString, {
      name,
      title,
      email,
      countryCode,
      summary,
    });

    // Update profiles/contacts in SIFA external accounts
    await updateProfileContacts(did, contactOperations ?? []);

    getResumeBasics({ handle }).set({
      name,
      title,
      email,
      countryCode,
      summary,
    });
    getProfileContacts({ handle }).refresh();
  },
);

// Legacy functions for resume page
export const getMemberProfile = query(
  v.object({ handle: v.string() }),
  async ({ handle }) => {
    const { locals } = getRequestEvent();
    const resolved = await resolveIdentifier(handle);
    if (!resolved) {
      error(404, `Cannot resolve ${handle}`);
    }
    // show local resume and fallback to sifa resume
    const isOwnProfile = resolved.did === locals.did;
    return (
      (await loadResume(resolved.did)) ??
      (await loadSifaResume(resolved.did, isOwnProfile))
    );
  },
);

export const updateMemberProfile = command(ResumeSchema, async (resume) => {
  const { locals } = getRequestEvent();
  const did = locals.did;
  const handle = locals.handle;
  if (!did || !handle) {
    error(401, "Unauthorized");
  }

  // Check if user is a member (exists in local database)
  const db = await getDB();
  const member = await db
    .selectFrom("members")
    .select("did")
    .where("did", "=", did)
    .executeTakeFirst();

  // update legacy members (only work, education, projects, skills, languages)
  if (member) {
    await updateResume(did, resume);
  }
  // update atproto + private data (only work, education, projects, skills, languages)
  await updateSifaResume(did, resume);

  // Refresh the profile query to reflect changes
  getMemberProfile({ handle }).refresh();
});
