import { unsign } from "cookie-signature";
import type { DidString } from "@atproto/lex";
import { env } from "$env/dynamic/private";
import { getRequestEvent, query } from "$app/server";
import { getOAuthClient } from "./auth";

export const getAccountData = query(async () => {
  const event = getRequestEvent();
  const signedSession = event.cookies.get("session");

  if (signedSession) {
    const unsigned = unsign(signedSession, env.SESSION_PASSWORD);

    if (unsigned) {
      try {
        const sessionData = JSON.parse(unsigned);
        const { did, handle } = sessionData;

        // restore OAuth session from database
        // this will invalidate login if session is removed from database
        const oauthClient = await getOAuthClient();
        await oauthClient.restore(did);

        return { handle: handle as string, did: did as DidString };
      } catch (error) {
        console.error("Failed to load session:", error);
      }
    }

    // clear cookie if session is not found
    event.cookies.delete("session", { path: "/" });
  }
});
