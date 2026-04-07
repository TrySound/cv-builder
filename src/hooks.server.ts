import { unsign } from "cookie-signature";
import { env } from "$env/dynamic/private";

export const handle = async ({ event, resolve }) => {
  const signedSession = event.cookies.get("session");

  if (signedSession) {
    const unsigned = unsign(signedSession, env.SESSION_PASSWORD);

    if (unsigned) {
      try {
        const sessionData = JSON.parse(unsigned);
        const { did, handle } = sessionData;

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
