import { json, error } from "@sveltejs/kit";
import { handleResolver } from "$lib/auth";
import { loadSifaResume } from "$lib/sifa.server";
import { loadLegacyResume } from "$lib/legacy-resume.server";

export const GET = async ({ params }) => {
  const handle = params.handle;
  if (!handle) {
    error(400, "Missing handle parameter");
  }
  const did = await handleResolver.resolve(handle);
  if (!did) {
    error(404);
  }
  const resume =
    (await loadLegacyResume(did)) ?? (await loadSifaResume(did, false));
  if (!resume) {
    error(404, "Profile not found");
  }
  return json(resume, {
    headers: {
      "Content-Type": "application/json",
    },
  });
};
