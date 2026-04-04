import * as v from "valibot";
import { error } from "@sveltejs/kit";
import { query, form, getRequestEvent } from "$app/server";
import { sql } from "kysely";
import { getDB } from "./db";

export const getMemberRecommendations = query(
  v.object({ handle: v.string() }),
  async ({ handle }) => {
    const event = getRequestEvent();
    if (!event.locals.did) {
      error(401);
    }

    const db = await getDB();

    // Get target member
    const targetMember = await db
      .selectFrom("members")
      .select("did")
      .where("handle", "=", handle)
      .executeTakeFirst();
    if (!targetMember) {
      error(404, "Member not found");
    }

    // Load recommendations with author info
    const recommendations = await db
      .selectFrom("recommendations")
      .innerJoin("members", "recommendations.author_did", "members.did")
      .where("recommendations.subject_did", "=", targetMember.did)
      .orderBy(
        sql`CASE WHEN recommendations.invitation_id IS NOT NULL THEN 0 ELSE 1 END`,
        "asc",
      )
      .orderBy("recommendations.created_at", "desc")
      .select([
        "recommendations.id",
        "recommendations.text",
        "recommendations.invitation_id",
        "recommendations.created_at",
        "recommendations.author_did",
        "members.name as author_name",
        "members.handle as author_handle",
      ])
      .execute();

    return {
      recommendations: recommendations.map((rec) => ({
        id: rec.id,
        text: rec.text,
        authorName: rec.author_name,
        authorHandle: rec.author_handle,
        authorDid: rec.author_did,
        createdAt: rec.created_at,
        isFromInvite: rec.invitation_id !== null,
      })),
      isRecommendedByMe: recommendations.some(
        (rec) => rec.author_did === event.locals.did,
      ),
    };
  },
);

export const createRecommendation = form(
  v.object({
    handle: v.pipe(v.string(), v.nonEmpty()),
    text: v.pipe(
      v.string(),
      v.minLength(200, "Recommendation should be at least 200 characters long"),
    ),
  }),
  async ({ handle, text }) => {
    const event = getRequestEvent();
    if (!event.locals.did) {
      error(401);
    }

    const db = await getDB();

    // Verify target is a member
    const targetMember = await db
      .selectFrom("members")
      .select(["handle", "did"])
      .where("handle", "=", handle)
      .executeTakeFirst();
    if (!targetMember) {
      error(404, "Member not found");
    }
    // Prevent self-recommendations
    if (event.locals.did === targetMember.did) {
      error(400, "Cannot recommend yourself");
    }

    // Check if already recommended
    const existingRecommendation = await db
      .selectFrom("recommendations")
      .select("id")
      .where("author_did", "=", event.locals.did)
      .where("subject_did", "=", targetMember.did)
      .executeTakeFirst();
    if (existingRecommendation) {
      error(400, "Already recommended this member");
    }

    // Create the recommendation
    await db
      .insertInto("recommendations")
      .values({
        author_did: event.locals.did,
        subject_did: targetMember.did,
        text,
      })
      .execute();

    getMemberRecommendations({ handle }).refresh();
  },
);
