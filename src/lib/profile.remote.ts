import * as v from "valibot";
import { error } from "@sveltejs/kit";
import { query, command, getRequestEvent } from "$app/server";
import { ResumeSchema } from "./jsonresume";
import { loadResume, updateResume } from "./resume.server";
import { loadSifaResume } from "./sifa.server";

export const getMemberProfile = query(
  v.object({ handle: v.string() }),
  async ({ handle }) => {
    const { locals } = getRequestEvent();
    let resume;
    // Logged in users: try local database first
    if (locals.did) {
      resume = await loadResume(handle);
    }
    // Non-logged in users: fetch from sifa.id
    if (!resume) {
      resume = await loadSifaResume(handle);
    }
    if (!resume) {
      error(404, "Profile not found");
    }
    return resume;
  },
);

export const updateMemberProfile = command(ResumeSchema, async (resume) => {
  const { locals } = getRequestEvent();
  const did = locals.did;
  if (!did || !locals.handle) {
    error(401, "Unauthorized");
  }
  await updateResume(did, resume);
  // Refresh the profile query to reflect changes
  getMemberProfile({ handle: locals.handle }).refresh();
});
