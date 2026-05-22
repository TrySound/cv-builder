import * as v from "valibot";
import { sql } from "kysely";
import { error } from "@sveltejs/kit";
import { query } from "$app/server";
import { resolveIdentifier } from "./atproto";
import { getDB } from "./dbkit";

export const getPublications = query(
  v.object({
    author: v.string(),
    limit: v.optional(v.number()),
  }),
  async ({ author, limit }) => {
    const resolved = await resolveIdentifier(author);
    if (!resolved) {
      error(404, `Cannot resolve ${author}`);
    }
    const db = await getDB();

    let queryBuilder = db
      .selectFrom("records_document as doc")
      .innerJoin("records_publication as pub", (join) =>
        join.on(
          sql`concat('at://', pub.did, '/site.standard.publication/', pub.rkey)`,
          "=",
          (q) => q.ref("doc.record", "->>").key("site"),
        ),
      )
      .select((q) => [
        q.ref("doc.record", "->").key("title").as("title"),
        q.ref("doc.record", "->").key("description").as("description"),
        q.ref("doc.record", "->").key("path").as("path"),
        q.ref("pub.record", "->").key("url").as("url"),
        q.ref("pub.record", "->").key("name").as("name"),
        q.ref("doc.record", "->").key("publishedAt").as("publishedAt"),
      ])
      .where("doc.did", "=", resolved.did)
      .orderBy((q) => q.ref("doc.record", "->>").key("publishedAt"), "desc");

    if (limit !== undefined) {
      queryBuilder = queryBuilder.limit(limit);
    }

    const documents = await queryBuilder.execute();

    const trimTrailingSlash = (text: string) =>
      text.endsWith("/") ? text.slice(0, -1) : text;

    const publications = documents.map((doc) => ({
      title: doc.title ?? "Untitled",
      description: doc.description ?? undefined,
      url: `${trimTrailingSlash(doc.url ?? "")}${doc.path ?? ""}`,
      publishedAt: doc.publishedAt ?? undefined,
    }));

    return {
      publications,
    };
  },
);
