import { redirect } from "@sveltejs/kit";

export const load = async ({ locals, url }) => {
  if (!locals.did || !locals.handle) {
    redirect(302, `/?redirect=${encodeURIComponent(url.pathname)}`);
  }

  // Only members can access invitations
  if (locals.role !== "member") {
    redirect(302, "/unauthorized");
  }

  return {
    handle: locals.handle,
    role: locals.role,
  };
};
