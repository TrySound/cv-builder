import { Agent } from "@atproto/api";
import { getOAuthClient } from "$lib/auth";

export const handle = async ({ event, resolve }) => {
  const did = event.cookies.get("session_did");

  if (did) {
    try {
      const oauthClient = await getOAuthClient();
      const oauthSession = await oauthClient.restore(did);
      event.locals.agent = new Agent(oauthSession);
      event.locals.did = did;
    } catch {
      event.cookies.delete("session_did", { path: "/" });
    }
  }

  return resolve(event);
};
