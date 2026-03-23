import {
  NodeOAuthClient,
  type NodeSavedState,
  type NodeSavedSession,
  buildAtprotoLoopbackClientMetadata,
} from "@atproto/oauth-client-node";

const BASE_URL = "http://127.0.0.1:5173";

const stateStore = new Map<string, NodeSavedState>();
const sessionStore = new Map<string, NodeSavedSession>();

export const createDevClient = () => {
  return new NodeOAuthClient({
    clientMetadata: buildAtprotoLoopbackClientMetadata({
      scope: "atproto transition:generic",
      redirect_uris: [`${BASE_URL}/auth/callback`],
    }),
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

export const oauthClient = createDevClient();
