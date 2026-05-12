// Backfill script for Contrail - fetches all historical records
import { getContrail } from "../src/lib/contrail.ts";

console.info("[contrail:backfill] Starting backfill...");
const startTime = Date.now();

const contrail = await getContrail();
await contrail.init();
console.info("[contrail] Initialized");

// Backfill all historical records
console.info("[contrail:backfill] Backfilling records...");
const result = await contrail.backfillAll();

const duration = Date.now() - startTime;
console.info("[contrail:backfill] Completed:", {
  ...result,
  duration: `${duration}ms`,
});

process.exit(0);
