import { Agent, type ComAtprotoRepoApplyWrites } from "@atproto/api";
import { Client, getMain, isDidIdentifier } from "@atproto/lex";
import type {
  $Typed,
  AtIdentifierString,
  CreateOptions,
  DatetimeString,
  DeleteOptions,
  DidString,
  Infer,
  InferRecordKey,
  PutOptions,
  RecordKeyString,
  RecordSchema,
} from "@atproto/lex";
import { extractPdsUrl } from "@atproto/oauth-client-node";
import { didResolver, handleResolver, resolveHandleFromDid } from "./auth";

export const getPdsClient = async (did: DidString) => {
  // Create type-safe client pointing to the user's PDS
  const didDoc = await didResolver.resolve(did);
  const pdsEndpoint = extractPdsUrl(didDoc);
  return new Client(pdsEndpoint);
};

// Helper to extract rkey from at:// URI
export const getRkey = (uri: string) =>
  (uri.split("/").pop() ?? "") as RecordKeyString;

export const getNow = () => new Date().toISOString() as DatetimeString;

/**
 * Resolve an identifier (either a handle or DID) to both DID and handle.
 * Returns an object with both did and handle properties.
 */
export const resolveIdentifier = async (
  identifier: string,
): Promise<undefined | { did: DidString; handle: string }> => {
  if (isDidIdentifier(identifier as AtIdentifierString)) {
    const handle = await resolveHandleFromDid(identifier);
    return { did: identifier as DidString, handle };
  } else {
    const did = await handleResolver.resolve(identifier);
    if (!did) {
      return;
    }
    return { did, handle: identifier };
  }
};

function getLiteralRecordKey<const T extends RecordSchema>(
  schema: T,
): InferRecordKey<T> {
  if (schema.key.startsWith("literal:")) {
    return schema.key.slice(8) as InferRecordKey<T>;
  }
  throw new TypeError(
    `An "rkey" must be provided for record key type "${schema.key}" (${schema.$type})`,
  );
}

function getDefaultRecordKey<const T extends RecordSchema>(
  schema: T,
): undefined | InferRecordKey<T> {
  // Let the server generate the TID
  if (schema.key === "tid") return undefined;
  if (schema.key === "any") return undefined;

  return getLiteralRecordKey(schema);
}

type ApplyWritesOperations = {
  create<const T extends RecordSchema>(
    ns: T | { main: T },
    input: Omit<Infer<T>, "$type">,
    options?: CreateOptions<T>,
  ): void;
  put<const T extends RecordSchema>(
    ns: T | { main: T },
    input: Omit<Infer<T>, "$type">,
    options?: PutOptions<T>,
  ): void;
  delete: <const T extends RecordSchema>(
    ns: T | { main: T },
    options?: DeleteOptions<T>,
  ) => void;
};

/**
 * Execute atomic batch writes with a functional API
 */
export async function applyWrites(
  agent: Agent,
  apply: (ops: ApplyWritesOperations) => void,
) {
  const writes: (
    | $Typed<ComAtprotoRepoApplyWrites.Create>
    | $Typed<ComAtprotoRepoApplyWrites.Update>
    | $Typed<ComAtprotoRepoApplyWrites.Delete>
  )[] = [];

  const operations: ApplyWritesOperations = {
    create: (ns, value, options) => {
      const schema = getMain(ns);
      const rkey = options?.rkey ?? getDefaultRecordKey(schema);
      writes.push({
        $type: "com.atproto.repo.applyWrites#create",
        collection: schema.$type,
        rkey,
        value,
      });
    },

    put: (ns, value, options) => {
      const schema = getMain(ns);
      const rkey = options?.rkey ?? getLiteralRecordKey(schema);
      writes.push({
        $type: "com.atproto.repo.applyWrites#update",
        collection: schema.$type,
        rkey,
        value,
      });
    },

    delete: (ns, options) => {
      const schema = getMain(ns);
      const rkey = options?.rkey ?? getLiteralRecordKey(schema);
      writes.push({
        $type: "com.atproto.repo.applyWrites#delete",
        collection: schema.$type,
        rkey,
      });
    },
  };

  apply(operations);

  return agent.com.atproto.repo.applyWrites({
    repo: agent.assertDid,
    writes,
  });
}
