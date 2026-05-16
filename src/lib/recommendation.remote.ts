import * as v from "valibot";
import { error } from "@sveltejs/kit";
import { Client } from "@atproto/lex";
import { Agent } from "@atproto/api";
import { query, form, getRequestEvent } from "$app/server";
import * as weareonhire from "$lib/lexicons/com/weareonhire/recommendation";
import { getDB } from "./dbkit";
import { getOAuthClient } from "./auth";
import { getNow, resolveIdentifier } from "./atproto";
import { getContrail } from "./contrail";

export const getProfileRecommendations = query(
  v.object({ handle: v.string() }),
  async ({ handle }) => {
    const event = getRequestEvent();
    const db = await getDB();

    const resolved = await resolveIdentifier(handle);
    if (!resolved) {
      error(404, `Cannot resolve ${handle}`);
    }

    const recommendations = await db
      .selectFrom("records_recommendation as rec")
      .where(
        (query) => query.ref("rec.record", "->>").key("subject"),
        "=",
        resolved.did,
      )
      .leftJoin("records_profile as author", "author.did", "rec.did")
      .leftJoin("identities as author_id", "author_id.did", "rec.did")
      .orderBy(
        (query) => query.ref("rec.record", "->>").key("createdAt"),
        "desc",
      )
      .select((query) => [
        "rec.uri",
        "rec.did as author_did",
        "author_id.handle as author_handle",
        query.ref("author.record", "->>").key("name").as("author_name"),
        query.ref("rec.record", "->>").key("reason").as("reason"),
        query.ref("rec.record", "->>").key("createdAt").as("created_at"),
      ])
      .execute();

    const recommendationsWithHandles = recommendations.map((item) => ({
      id: item.uri,
      reason: item.reason,
      authorHandle: item.author_handle ?? item.author_did,
      authorName: item.author_name,
      createdAt: item.created_at,
    }));

    return {
      recommendations: recommendationsWithHandles,
      isRecommendedByMe: recommendations.some(
        (rec) => rec.author_did === event.locals.did,
      ),
    };
  },
);

export const createRecommendation = form(
  v.object({
    handle: v.pipe(v.string(), v.nonEmpty()),
    reason: v.pipe(
      v.string(),
      v.minLength(200, "Recommendation should be at least 200 characters long"),
    ),
  }),
  async ({ handle, reason }) => {
    const event = getRequestEvent();
    if (!event.locals.did) {
      error(401);
    }

    const resolved = await resolveIdentifier(handle);
    if (!resolved) {
      error(404, `Cannot resolve ${handle}`);
    }

    if (event.locals.did === resolved.did) {
      error(400, "Cannot recommend yourself");
    }

    const db = await getDB();
    const existingRecommendation = await db
      .selectFrom("records_recommendation")
      .select("uri")
      .where("did", "=", event.locals.did)
      .where(
        (query) => query.ref("record", "->>").key("subject"),
        "=",
        resolved.did,
      )
      .executeTakeFirst();
    if (existingRecommendation) {
      error(400, "Already recommended this person");
    }

    const createdAt = getNow();

    const oauthClient = await getOAuthClient();
    const session = await oauthClient.restore(event.locals.did);
    const client = new Client(new Agent(session));
    const createdRecommendation = await client.create(weareonhire, {
      subject: resolved.did,
      reason,
      createdAt,
    });
    const contrail = await getContrail();
    contrail.notify(createdRecommendation.uri);

    getProfileRecommendations({ handle }).refresh();
  },
);
