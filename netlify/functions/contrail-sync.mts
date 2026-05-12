import type { Config } from "@netlify/functions";
import { getContrail } from "../../src/lib/contrail";

export default async () => {
  const startTime = Date.now();
  console.info("[contrail-sync] Starting sync...");

  try {
    const contrail = await getContrail();
    await contrail.init();

    // Contrail handles:
    // - Getting cursor from its own table
    // - Connecting to Jetstream
    // - Processing all configured collections
    // - Storing records
    // - Saving cursor
    await contrail.ingest({});

    const duration = Date.now() - startTime;
    console.info(`[contrail-sync] Completed in ${duration}ms`);
  } catch (error) {
    console.error("[contrail-sync] Error:", error);
    // Don't throw - let Netlify log and continue
  }
};

export const config: Config = {
  schedule: "*/15 * * * *",
};
