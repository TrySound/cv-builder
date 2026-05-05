import { env } from "$env/dynamic/private";
import {
  NodeOAuthClient,
  JoseKey,
  Keyset,
  buildAtprotoLoopbackClientMetadata,
  createDidResolver,
  createHandleResolver,
  type OAuthClientMetadataInput,
  type RuntimeLock,
  type NodeSavedStateStore,
  type NodeSavedSessionStore,
} from "@atproto/oauth-client-node";
import { Client, type DidString } from "@atproto/lex";
import { getDB } from "$lib/db";
import { timeAsync } from "$lib/profiling";

export const handleResolver = createHandleResolver({
  handleResolver: "https://npmx.social",
});
export const didResolver = createDidResolver({});

export const resolveHandleFromDid = async (
  did: string,
  requestId?: string,
): Promise<string> => {
  try {
    const doc = await timeAsync(
      requestId,
      "didResolver.resolve",
      () => didResolver.resolve(did as DidString),
      { did },
    );
    return doc.alsoKnownAs?.at(0)?.slice("at://".length) ?? did;
  } catch {
    // Fallback to DID if resolution fails (e.g., for seeded/test data)
    return did;
  }
};

export const SCOPE = [
  "atproto",
  "rpc:app.bsky.actor.getProfile?aud=did:web:api.bsky.app#bsky_appview",
  // weareonhire records
  "repo:com.weareonhire.recommendation",
  "repo:com.weareonhire.profile",
  // Sifa profile records
  "repo:id.sifa.profile.self",
  "repo:id.sifa.profile.position",
  "repo:id.sifa.profile.education",
  "repo:id.sifa.profile.project",
  "repo:id.sifa.profile.skill",
  "repo:id.sifa.profile.language",
  "repo:id.sifa.profile.externalAccount",
];

export const getClientMetadata = (): OAuthClientMetadataInput => {
  return {
    client_id: `${env.BASE_URL}/client-metadata.json`,
    client_name: "weareonhire",
    client_uri: env.BASE_URL,
    redirect_uris: [`${env.BASE_URL}/auth/callback`],
    scope: SCOPE.join(" "),
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
    token_endpoint_auth_method: "private_key_jwt",
    token_endpoint_auth_signing_alg: "ES256",
    application_type: "web",
    dpop_bound_access_tokens: true,
    jwks_uri: `${env.BASE_URL}/jwks.json`,
  };
};

const locks = new Map<string, Promise<void>>();

const requestLock: RuntimeLock = (key, fn) => {
  const current = locks.get(key) ?? Promise.resolve();
  const next = current.then(fn);
  locks.set(
    key,
    next.then(
      () => {
        locks.delete(key);
      },
      () => {
        locks.delete(key);
      },
    ),
  );
  return next;
};

const createKyselyStateStore = async (
  requestId?: string,
): Promise<NodeSavedStateStore> => {
  const db = await getDB();
  return {
    async get(key) {
      const result = await timeAsync(
        requestId,
        "db.states.get",
        () =>
          db
            .selectFrom("states")
            .select("data")
            .where("key", "=", key)
            .executeTakeFirst(),
        { key },
      );
      if (result) {
        return JSON.parse(result.data);
      }
    },
    async set(key, value) {
      const data = JSON.stringify(value);
      await timeAsync(
        requestId,
        "db.states.set",
        () =>
          db
            .insertInto("states")
            .values({ key, data })
            .onConflict((oc) => oc.column("key").doUpdateSet({ data }))
            .execute(),
        { key },
      );
    },
    async del(key) {
      await timeAsync(
        requestId,
        "db.states.del",
        () => db.deleteFrom("states").where("key", "=", key).execute(),
        { key },
      );
    },
  };
};

const createKyselySessionStore = async (
  requestId?: string,
): Promise<NodeSavedSessionStore> => {
  const db = await getDB();
  return {
    async get(key) {
      const result = await timeAsync(
        requestId,
        "db.sessions.get",
        () =>
          db
            .selectFrom("sessions")
            .select("data")
            .where("key", "=", key)
            .executeTakeFirst(),
        { key },
      );
      if (result) {
        return JSON.parse(result.data);
      }
    },
    async set(key, value) {
      const data = JSON.stringify(value);
      await timeAsync(
        requestId,
        "db.sessions.set",
        () =>
          db
            .insertInto("sessions")
            .values({ key, data })
            .onConflict((oc) => oc.column("key").doUpdateSet({ data }))
            .execute(),
        { key },
      );
    },
    async del(key) {
      await timeAsync(
        requestId,
        "db.sessions.del",
        () => db.deleteFrom("sessions").where("key", "=", key).execute(),
        { key },
      );
    },
  };
};

const createOAuthClient = async () => {
  const isDev = Boolean(env.DEV);
  let clientMetadata;
  let keyset;
  if (isDev) {
    clientMetadata = buildAtprotoLoopbackClientMetadata({
      scope: SCOPE.join(" "),
      redirect_uris: ["http://127.0.0.1:5173/auth/callback"],
    });
  } else {
    clientMetadata = getClientMetadata();
    keyset = new Keyset([await JoseKey.fromJWK(JSON.parse(env.PRIVATE_KEY))]);
  }
  return new NodeOAuthClient({
    clientMetadata,
    keyset,
    requestLock,
    handleResolver,
    didResolver,
    stateStore: await createKyselyStateStore(),
    sessionStore: await createKyselySessionStore(),
  });
};

let oauthClient: NodeOAuthClient;

export const getOAuthClient = async () => {
  if (!oauthClient) {
    oauthClient = await createOAuthClient();
  }
  return oauthClient;
};

// Public unauthenticated client for reading public data
let publicClient: Client | null = null;

export const getPublicClient = () => {
  if (!publicClient) {
    publicClient = new Client("https://public.api.bsky.app");
  }
  return publicClient;
};
