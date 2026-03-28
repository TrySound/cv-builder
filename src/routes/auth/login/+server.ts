import { redirect } from "@sveltejs/kit";
import { getOAuthClient } from "$lib/auth";

export const GET = async ({ url, cookies }) => {
  const prompt =
    url.searchParams.get("prompt") === "login" ? "login" : "create";
  const code = url.searchParams.get("code");
  const oauthClient = await getOAuthClient();
  const authUrl = await oauthClient.authorize("https://bsky.social", {
    scope: "atproto transition:generic",
    prompt,
  });
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
  redirect(302, authUrl);
};
