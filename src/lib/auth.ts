import { env } from "$env/dynamic/private";
import {
  NodeOAuthClient,
  buildAtprotoLoopbackClientMetadata,
  type NodeSavedState,
  type NodeSavedSession,
  type OAuthClientMetadataInput,
  JoseKey,
  Keyset,
  type RuntimeLock,
} from "@atproto/oauth-client-node";

export const getClientMetadata = (): OAuthClientMetadataInput => {
  return {
    client_id: `${env.BASE_URL}/client-metadata.json`,
    client_name: "CV Builder",
    client_uri: env.BASE_URL,
    redirect_uris: [`${env.BASE_URL}/auth/callback`],
    scope: "atproto transition:generic",
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
    token_endpoint_auth_method: "private_key_jwt",
    token_endpoint_auth_signing_alg: "ES256",
    application_type: "web",
    dpop_bound_access_tokens: true,
    jwks_uri: `${env.BASE_URL}/jwks.json`,
  };
};

const stateStore = new Map<string, NodeSavedState>();
const sessionStore = new Map<string, NodeSavedSession>();
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

const createOAuthClient = async () => {
  const isDev = Boolean(env.DEV);
  let clientMetadata;
  let keyset;
  if (isDev) {
    clientMetadata = buildAtprotoLoopbackClientMetadata({
      scope: "atproto transition:generic",
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
    // @todo bake by db
    stateStore: {
      async get(key) {
        return stateStore.get(key);
      },
      async set(key, value) {
        stateStore.set(key, value);
      },
      async del(key) {
        stateStore.delete(key);
      },
    },
    sessionStore: {
      async get(key) {
        return sessionStore.get(key);
      },
      async set(key, value) {
        sessionStore.set(key, value);
      },
      async del(key) {
        sessionStore.delete(key);
      },
    },
  });
};

let oauthClient: NodeOAuthClient;

export const getOAuthClient = async () => {
  if (!oauthClient) {
    oauthClient = await createOAuthClient();
  }
  return oauthClient;
};
