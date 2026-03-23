import type { Handle } from "@sveltejs/kit";
import { Agent } from "@atproto/api";
import { oauthClient } from "$lib/auth";

export const handle: Handle = async ({ event, resolve }) => {
  const did = event.cookies.get("session_did");

  if (did) {
    try {
      const oauthSession = await oauthClient.restore(did);
      event.locals.agent = new Agent(oauthSession);
      event.locals.did = did;
    } catch {
      event.cookies.delete("session_did", { path: "/" });
    }
  }

  return resolve(event);
};
