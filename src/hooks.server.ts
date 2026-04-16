import { unsign } from "cookie-signature";
import { env } from "$env/dynamic/private";
import { getOAuthClient } from "$lib/auth";

export const handle = async ({ event, resolve }) => {
  const signedSession = event.cookies.get("session");

  if (signedSession) {
    const unsigned = unsign(signedSession, env.SESSION_PASSWORD);

    if (unsigned) {
      try {
        const sessionData = JSON.parse(unsigned);
        const { did, handle, role } = sessionData;

        // restore OAuth session from database
        const oauthClient = await getOAuthClient();
        // this will invalidate login if session is removed from database
        const session = await oauthClient.restore(did);

        event.locals.did = did;
        event.locals.handle = handle;
        event.locals.role = role ?? "member";
        event.locals.session = session;
      } catch {
        event.cookies.delete("session", { path: "/" });
      }
    } else {
      event.cookies.delete("session", { path: "/" });
    }
  }

  return resolve(event);
};
