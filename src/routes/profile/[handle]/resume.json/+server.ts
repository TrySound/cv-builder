import { json, error } from "@sveltejs/kit";
import { loadResume } from "$lib/resume.server";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ params, locals }) => {
  // Check authentication
  if (!locals.did) {
    error(401, "Unauthorized");
  }

  const handle = params.handle;

  if (!handle) {
    error(400, "Missing handle parameter");
  }

  const resume = await loadResume(handle);

  if (!resume) {
    error(404, "Member not found");
  }

  return json(resume, {
    headers: {
      "Content-Type": "application/json",
    },
  });
};
