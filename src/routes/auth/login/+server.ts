import { redirect } from "@sveltejs/kit";
import { oauthClient } from "$lib/auth";

export const GET = async ({ url }) => {
  const handle = url.searchParams.get("handle");
  if (!handle) {
    redirect(302, "/login");
  }
  const authUrl = await oauthClient.authorize(handle, {
    scope: "atproto transition:generic",
  });
  redirect(302, authUrl.toString());
};
