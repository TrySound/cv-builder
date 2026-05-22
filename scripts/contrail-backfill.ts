// Backfill script for Contrail.
//
// Seamlessly handles both first-time backfill and adding new collections.
// 1. backfillAll()  – discovers all DIDs via relays and backfills discoverable collections.
// 2. refresh()      – re-walks every known DID and fills in any missing/stale records
//                     for all collections (including discover: false / dependent ones).
import { getContrail } from "../src/lib/contrail.ts";

const startTime = Date.now();

console.info("[contrail:backfill] Starting...");

const contrail = await getContrail();
await contrail.init();
console.info("[contrail] Initialized");

console.info("[contrail:backfill] Discovering records...");
const discoverResult = await contrail.discover();
console.info(
  `[contrail:backfill] Step 1 done: ${discoverResult.length} DIDs discovered`,
);

console.info("[contrail:backfill] Backfilling collections...");
const refreshResult = await contrail.refresh();
console.info("[contrail:backfill] Step 2 done:", refreshResult);

const duration = Date.now() - startTime;
console.info("[contrail:backfill] Completed:", {
  discover: discoverResult.length,
  refresh: refreshResult,
  totalDuration: `${duration}ms`,
});

process.exit(0);
