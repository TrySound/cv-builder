import * as v from "valibot";
import { error } from "@sveltejs/kit";
import { query, command, getRequestEvent } from "$app/server";
import { ResumeSchema } from "./jsonresume";
import { loadResume, updateResume } from "./resume.server";
import { loadSifaResume, updateSifaResume } from "./sifa.server";
import { getDB } from "./db";

export const getMemberProfile = query(
  v.object({ handle: v.string() }),
  async ({ handle }) => {
    // show local resume and fallback to sifa resume
    return (await loadResume(handle)) ?? (await loadSifaResume(handle));
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

  if (member) {
    // Member: save to local database
    await updateResume(did, resume);
  } else {
    // Visitor: save to sifa
    await updateSifaResume(did, resume);
  }

  // Refresh the profile query to reflect changes
  getMemberProfile({ handle }).refresh();
});
