import { JoseKey } from "@atproto/oauth-client-node";

const kid = Date.now().toString();
const key = await JoseKey.generate(["ES256"], kid);
console.info(JSON.stringify(key.privateJwk));
