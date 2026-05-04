import * as v from "valibot";
import { error } from "@sveltejs/kit";
import { Client, type DatetimeString } from "@atproto/lex";
import { Agent } from "@atproto/api";
import { query, form, getRequestEvent } from "$app/server";
import * as weareonhire from "$lib/lexicons/com/weareonhire/recommendation";
import { getDB } from "./db";
import { getOAuthClient } from "./auth";
import { resolveIdentifier } from "./atproto";

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
      .selectFrom("recommendation_index")
      .where("recommendation_index.subject_did", "=", resolved.did)
      .leftJoin(
        "profile_index as author",
        "author.did",
        "recommendation_index.author_did",
      )
      .orderBy("recommendation_index.created_at", "desc")
      .select([
        "recommendation_index.uri",
        "recommendation_index.author_did",
        "recommendation_index.reason",
        "recommendation_index.created_at",
        "author.name as author_name",
        "author.handle as author_handle",
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
      .selectFrom("recommendation_index")
      .select("uri")
      .where("author_did", "=", event.locals.did)
      .where("subject_did", "=", resolved.did)
      .executeTakeFirst();
    if (existingRecommendation) {
      error(400, "Already recommended this person");
    }

    const createdAt = new Date().toISOString() as DatetimeString;

    const oauthClient = await getOAuthClient();
    const session = await oauthClient.restore(event.locals.did);
    const client = new Client(new Agent(session));
    const createdRecommendation = await client.create(weareonhire.main, {
      subject: resolved.did,
      reason,
      createdAt,
    });
    await db
      .insertInto("recommendation_index")
      .values({
        uri: createdRecommendation.uri,
        author_did: event.locals.did,
        subject_did: resolved.did,
        reason,
        created_at: createdAt,
      })
      .execute();

    getProfileRecommendations({ handle }).refresh();
  },
);
