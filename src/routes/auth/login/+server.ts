import { redirect } from "@sveltejs/kit";
import { getOAuthClient, SCOPE } from "$lib/auth";

export const GET = async ({ url, cookies }) => {
  const prompt =
    url.searchParams.get("prompt") === "login" ? "login" : "create";
  const code = url.searchParams.get("code");
  const handle = url.searchParams.get("handle");
  const redirectUrl = url.searchParams.get("redirect");

  let authUrl;
  try {
    const oauthClient = await getOAuthClient();
    // use handle to resolve pds or fallback to bsky login
    authUrl = await oauthClient.authorize(handle ?? "https://npmx.social", {
      scope: SCOPE.join(" "),
      prompt,
    });
  } catch (error) {
    console.error(error);
    // in case of invalid handle, redirect back to invite page with error
    if (code) {
      redirect(302, `/invite/${code}?error=invalid_handle`);
    }
    redirect(302, "/unauthorized");
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
  // Store redirect URL in cookie for post-auth redirect
  if (redirectUrl) {
    cookies.set("redirect", redirectUrl, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60, // 1 hour
    });
  }
  redirect(302, authUrl);
};
