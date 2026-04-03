import { json } from "@sveltejs/kit";
import { getDB } from "$lib/db";
import type { Resume } from "$lib/resume-schema";

export const GET = async ({ url }) => {
  const db = await getDB();

  try {
    const jobId = url.searchParams.get("id");

    if (!jobId) {
      return json({ error: "Missing job ID" }, { status: 400 });
    }

    const job = await db
      .selectFrom("pdf_jobs")
      .select(["status", "result", "error", "created_at"])
      .where("id", "=", jobId)
      .executeTakeFirst();

    if (!job) {
      return json({ error: "Job not found" }, { status: 404 });
    }

    // If completed successfully, return the resume
    if (job.status === "completed" && job.result) {
      let resume: Resume;
      try {
        resume = job.result;
      } catch {
        return json(
          { error: "Failed to parse resume result" },
          { status: 500 },
        );
      }

      return json({
        status: "completed",
        resume,
      });
    }

    // If failed, return the error
    if (job.status === "failed") {
      return json({
        status: "failed",
        error: job.error || "Unknown error occurred",
      });
    }

    // Still pending (includes both waiting to start and actively processing)
    return json({
      status: "pending",
      createdAt: job.created_at,
    });
  } catch (error) {
    console.error("Status check error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return json({ error: `Server error: ${message}` }, { status: 500 });
  }
};
