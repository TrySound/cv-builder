import * as v from "valibot";
import { error } from "@sveltejs/kit";
import { Client, type DatetimeString, type DidString } from "@atproto/lex";
import { Agent } from "@atproto/api";
import { query, form, getRequestEvent } from "$app/server";
import * as weareonhire from "$lib/lexicons/com/weareonhire/recommendation";
import { getDB } from "./db";
import { getOAuthClient, handleResolver, resolveHandleFromDid } from "./auth";

export const getProfileRecommendations = query(
  v.object({ handle: v.string() }),
  async ({ handle }) => {
    const event = getRequestEvent();
    const db = await getDB();

    const profileDid = await handleResolver.resolve(handle);

    const recommendations = await db
      .selectFrom("recommendation_index")
      .where("recommendation_index.subject_did", "=", profileDid)
      .orderBy("recommendation_index.created_at", "desc")
      .selectAll()
      .execute();

    const recommendationsWithHandles = await Promise.all(
      recommendations.map(async (item) => {
        const authorHandle = await resolveHandleFromDid(
          item.author_did as DidString,
        );
        return {
          id: item.uri,
          reason: item.reason,
          authorHandle: authorHandle,
          createdAt: item.created_at,
        };
      }),
    );

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

    const targetDid = await handleResolver.resolve(handle);
    if (!targetDid) {
      error(404, "Handle not found");
    }
    if (event.locals.did === targetDid) {
      error(400, "Cannot recommend yourself");
    }

    const db = await getDB();
    const existingRecommendation = await db
      .selectFrom("recommendation_index")
      .select("uri")
      .where("author_did", "=", event.locals.did)
      .where("subject_did", "=", targetDid)
      .executeTakeFirst();
    if (existingRecommendation) {
      error(400, "Already recommended this person");
    }

    const createdAt = new Date().toISOString() as DatetimeString;

    const oauthClient = await getOAuthClient();
    const session = await oauthClient.restore(event.locals.did);
    const client = new Client(new Agent(session));
    const createdRecommendation = await client.create(weareonhire.main, {
      subject: targetDid,
      reason,
      createdAt,
    });
    await db
      .insertInto("recommendation_index")
      .values({
        uri: createdRecommendation.uri,
        author_did: event.locals.did,
        subject_did: targetDid,
        reason,
        created_at: createdAt,
      })
      .execute();

    getProfileRecommendations({ handle }).refresh();
  },
);
