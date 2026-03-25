import { Agent } from "@atproto/api";
import type { DidString } from "@atproto/lex";
import { unsign } from "cookie-signature";
import { didResolver, getOAuthClient } from "$lib/auth";
import { env } from "$env/dynamic/private";

export const handle = async ({ event, resolve }) => {
  const signedSession = event.cookies.get("session");

  if (signedSession) {
    const did = unsign(signedSession, env.SESSION_PASSWORD);

    if (did) {
      const didDoc = await didResolver.resolve(did as DidString);
      // at://handle
      const handle = didDoc.alsoKnownAs?.[0]?.slice("at://".length);
      try {
        const oauthClient = await getOAuthClient();
        const oauthSession = await oauthClient.restore(did);
        event.locals.agent = new Agent(oauthSession);
        event.locals.did = did;
        event.locals.handle = handle;
      } catch {
        event.cookies.delete("session", { path: "/" });
      }
    } else {
      event.cookies.delete("session", { path: "/" });
    }
  }

  return resolve(event);
};
