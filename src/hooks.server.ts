import { unsign } from "cookie-signature";
import { env } from "$env/dynamic/private";
import { getOAuthClient } from "$lib/auth";
import {
  startRequestTiming,
  endRequestTiming,
  startTiming,
  endTiming,
  formatTimingReport,
  timeAsync,
} from "$lib/profiling";

export const handle = async ({ event, resolve }) => {
  // Start request timing
  const requestId = startRequestTiming(
    event.url.pathname + event.url.search,
    event.request.method,
  );
  event.locals.requestId = requestId;

  const signedSession = event.cookies.get("session");

  if (signedSession) {
    const unsigned = unsign(signedSession, env.SESSION_PASSWORD);

    if (unsigned) {
      try {
        const sessionData = JSON.parse(unsigned);
        const { did, handle, role } = sessionData;

        // restore OAuth session from database
        const oauthClient = await timeAsync(
          requestId,
          "getOAuthClient",
          () => getOAuthClient(),
        );

        // this will invalidate login if session is removed from database
        const session = await timeAsync(
          requestId,
          "oauthClient.restore",
          () => oauthClient.restore(did),
          { did },
        );

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

  const theme = event.cookies.get("theme");

  startTiming(requestId, "resolve");
  let response;
  try {
    // check values to prevent script injection
    if (theme === "light" || theme === "dark") {
      response = await resolve(event, {
        transformPageChunk({ html }) {
          return html.replace(
            `data-theme="system"`,
            `data-theme="${theme}"`,
          );
        },
      });
    } else {
      response = await resolve(event);
    }
  } finally {
    endTiming(requestId);

    // Generate and log timing report
    const report = endRequestTiming(requestId);
    if (report && report.totalDuration > 100) {
      console.log(formatTimingReport(report));
    }
  }

  return response;
};
