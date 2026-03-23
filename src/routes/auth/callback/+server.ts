import { redirect } from "@sveltejs/kit";
import { Agent } from "@atproto/api";
import { oauthClient } from "$lib/auth";

export const GET = async ({ url, cookies }) => {
  const { session } = await oauthClient.callback(url.searchParams);

  cookies.set("session_did", session.did, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: 60 * 60 * 24 * 30,
  });

  const agent = new Agent(session);
  const profile = await agent.getProfile({ actor: session.did });
  const handle = profile.data.handle;

  redirect(302, `/profile/${handle}`);
};
