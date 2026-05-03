import { error } from "@sveltejs/kit";
import { resolveIdentifier } from "$lib/atproto";

export const load = async ({ params }) => {
  const resolved = await resolveIdentifier(params.handle);
  if (!resolved) {
    error(404, `Cannot resolve profile for ${params.handle}`);
  }

  return {
    profile: {
      handle: resolved.handle,
    },
  };
};
