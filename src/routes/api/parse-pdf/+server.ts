import { env } from "$env/dynamic/private";
import { error, json } from "@sveltejs/kit";
import { getDB } from "$lib/db";
import { getAccountData } from "$lib/account.remote";

const MAX_FILE_SIZE = 500 * 1024; // 500kB

export const POST = async ({ request, url }) => {
  const account = await getAccountData()
  if (!account) {
    error(403);
  }

  console.info(`Parse PDF for ${account.handle}`);
  const db = await getDB();

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file type
    if (file.type !== "application/pdf") {
      return json({ error: "Only PDF files are accepted" }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return json({ error: "PDF must be under 500kB" }, { status: 400 });
    }

    // Convert file to ArrayBuffer and then to base64
    const arrayBuffer = await file.arrayBuffer();
    const pdfBase64 = Buffer.from(arrayBuffer).toString("base64");

    // Create job in PostgreSQL and get auto-generated UUID
    const insertResult = await db
      .insertInto("pdf_jobs")
      .values({
        status: "pending",
        result: null,
        error: null,
        retry_count: 0,
      })
      .returning("id")
      .executeTakeFirstOrThrow();

    const jobId = insertResult.id;

    if (env.DEV) {
      // Development: Invoke background function directly with mock Request
      // Dynamic import inside handler to avoid build-time resolution
      const { parsePdf } =
        await import("../../../../netlify/functions/parse-pdf-background.mjs");

      const request = new Request(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, pdfBase64 }),
      });

      // Fire and forget - don't wait for response (same as production)
      parsePdf({ request, db, GEMINI_API_KEY: env.GEMINI_API_KEY }).catch(
        (error: Error) => {
          console.error("[DEV] Background function error:", error);
        },
      );
    } else {
      // Production: Trigger background function via HTTP
      const siteUrl = url.origin;
      const backgroundFunctionUrl = `${siteUrl}/.netlify/functions/parse-pdf-background`;

      // Fire and forget - don't wait for response
      fetch(backgroundFunctionUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, pdfBase64 }),
      }).catch((error) => {
        console.error("Failed to trigger background function:", error);
      });
    }

    // Return immediately with job ID for polling
    return json(
      {
        jobId,
        status: "pending",
        message: "PDF parsing started. Poll for results.",
      },
      { status: 202 },
    );
  } catch (error) {
    console.error("PDF parsing initiation error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return json({ error: `Server error: ${message}` }, { status: 500 });
  }
};
