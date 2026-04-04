import { redirect } from "@sveltejs/kit";

export const load = async ({ locals }) => {
  if (!locals.did || !locals.handle) {
    redirect(302, "/");
  }
  return {
    handle: locals.handle,
  };
};
