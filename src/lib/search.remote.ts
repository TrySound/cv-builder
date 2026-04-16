import * as v from "valibot";
import { Agent } from "@atproto/api";
import { query } from "$app/server";

const publicAgent = new Agent("https://public.api.bsky.app");

export const searchProfiles = query(
  v.object({ q: v.string() }),
  async ({ q }) => {
    if (!q.trim()) {
      return { results: [], query: q };
    }

    const response = await publicAgent.app.bsky.actor.searchActorsTypeahead({
      q: q.trim(),
      limit: 10,
    });

    const results = response.data.actors.map((actor) => {
      return {
        handle: actor.handle,
        displayName: actor.displayName,
        avatar: actor.avatar,
      };
    });

    return {
      results,
      query: q,
    };
  },
);
