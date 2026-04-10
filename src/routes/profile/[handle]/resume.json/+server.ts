import { json, error } from "@sveltejs/kit";
import { loadResume } from "$lib/resume.server";
import { loadSifaResume } from "$lib/sifa.server";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ params, locals }) => {
  const handle = params.handle;
  if (!handle) {
    error(400, "Missing handle parameter");
  }
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
  return json(resume, {
    headers: {
      "Content-Type": "application/json",
    },
  });
};
