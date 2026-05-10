import { redirect } from "@sveltejs/kit";
import { getOAuthClient, SCOPE } from "$lib/auth";

export const GET = async ({ url, cookies }) => {
  const prompt =
    url.searchParams.get("prompt") === "login" ? "login" : "create";
  const handle = url.searchParams.get("handle");
  // redirect to provided url
  let redirectUrl = url.searchParams.get("redirect");
  // except for home page which should be redirected to user profile
  if (redirectUrl === "/") {
    redirectUrl = `/profile/${handle}`;
  }

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
    redirect(302, "/unauthorized");
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
