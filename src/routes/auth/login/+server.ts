import { redirect } from "@sveltejs/kit";
import { getOAuthClient } from "$lib/auth";

export const GET = async ({ url, cookies }) => {
  const handle = url.searchParams.get("handle");
  const code = url.searchParams.get("code");
  if (!handle) {
    redirect(302, "/");
  }
  // Store invite code in cookie for post-auth handling
  if (code) {
    cookies.set("invite_code", code, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60, // 1 hour
    });
  }
  const oauthClient = await getOAuthClient();
  const authUrl = await oauthClient.authorize(handle, {
    scope: "atproto transition:generic",
  });
  redirect(302, authUrl.toString());
};
