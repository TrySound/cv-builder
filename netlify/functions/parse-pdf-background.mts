import * as v from "valibot";
import { GoogleGenAI } from "@google/genai";
import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import { type Resume, ResumeSchema } from "../../src/lib/resume-schema";
import type { DatabaseSchema } from "../../src/lib/db";

let ai: undefined | GoogleGenAI;

const SYSTEM_PROMPT = `You are a resume parser. Extract structured information from the provided PDF resume and return JSON matching these TypeScript interfaces:

import * as v from "valibot";

export const EmploymentTypeSchema = v.union([
  v.literal("fulltime"),
  v.literal("parttime"),
  v.literal("contract"),
  v.literal("freelance"),
  v.literal("internship"),
]);

export type EmploymentType = v.InferOutput<typeof EmploymentTypeSchema>;

export const WorkplaceTypeSchema = v.union([
  v.literal("onsite"),
  v.literal("remote"),
  v.literal("hybrid"),
]);

export type WorkplaceType = v.InferOutput<typeof WorkplaceTypeSchema>;

export const ProfileSchema = v.object({
  name: v.string(),
  email: v.optional(v.string()),
  linkedin: v.optional(v.string()),
  github: v.optional(v.string()),
  website: v.optional(v.string()),
  location: v.optional(v.string()),
  headline: v.optional(v.string()),
  summary: v.optional(v.string()),
  industry: v.optional(v.string()),
});

export type Profile = v.InferOutput<typeof ProfileSchema>;

export const PositionSchema = v.object({
  company: v.string(),
  title: v.string(),
  location: v.optional(v.string()),
  workplaceType: v.optional(WorkplaceTypeSchema),
  employmentType: v.optional(EmploymentTypeSchema),
  description: v.optional(v.string()),
  startedAt: v.optional(v.string()),
  endedAt: v.optional(v.string()),
});

export type Position = v.InferOutput<typeof PositionSchema>;

export const EducationSchema = v.object({
  institution: v.string(),
  degree: v.string(),
  field: v.optional(v.string()),
  description: v.optional(v.string()),
  startedAt: v.optional(v.string()),
  endedAt: v.optional(v.string()),
});

export type Education = v.InferOutput<typeof EducationSchema>;

export const ProjectSchema = v.object({
  name: v.string(),
  description: v.optional(v.string()),
  url: v.optional(v.string()),
  startedAt: v.optional(v.string()),
  endedAt: v.optional(v.string()),
});

export type Project = v.InferOutput<typeof ProjectSchema>;

export const ResumeSchema = v.object({
  profile: ProfileSchema,
  positions: v.array(PositionSchema),
  education: v.array(EducationSchema),
  projects: v.array(ProjectSchema),
  preferredWorkplace: v.array(WorkplaceTypeSchema),
  skills: v.array(v.string()),
  languages: v.array(v.string()),
});

export type Resume = v.InferOutput<typeof ResumeSchema>;

CRITICAL RULES:
1. Return ONLY valid JSON matching these TypeScript interfaces - no markdown, no code blocks
2. Preserve formatting of paragraphs using newlines
3. Preserve formatting of lists using "-"
4. Fields marked with ? are optional - either include the value or OMIT the field entirely
5. NEVER use null values - if data is missing, simply omit the field from the JSON
6. NEVER include trailing commas in arrays or objects - this will break JSON parsing
7. Use empty arrays [] for positions, education, projects, skills, languages if none found
8. Use empty array [] for preferredWorkplace if not specified
9. For current positions, omit endedAt field entirely (never set to null)
10. Dates: ISO format YYYY-MM-DD preferred, or written format like "Jan 2020"
11. Ensure all quotes, brackets, and braces are properly closed
12. Extract all available information from the resume
13. Infer workplaceType and employmentType from job descriptions when possible

EXAMPLE VALID OUTPUT:
{
  "profile": {
    "name": "John Doe",
    "email": "john@example.com",
    "linkedin": "https://linkedin.com/in/johndoe"
  },
  "positions": [
    {
      "company": "Google",
      "title": "Software Engineer",
      "location": "Mountain View, CA",
      "startedAt": "2020-01",
      "endedAt": "2023-06"
    }
  ],
  "education": [],
  "projects": [],
  "preferredWorkplace": ["hybrid", "remote"],
  "skills": ["TypeScript", "React", "Node.js"],
  "languages": ["English"]
}

Parse the attached PDF and return valid JSON only.`;

function createDB() {
  const connectionString = process.env.CONNECTION_STRING;
  if (!connectionString) {
    throw new Error(
      "CONNECTION_STRING environment variable is required in production",
    );
  }

  return new Kysely<DatabaseSchema>({
    dialect: new PostgresDialect({
      pool: new Pool({
        connectionString,
      }),
    }),
  });
}

function cleanJsonResponse(text: string): string {
  let cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "");
  cleaned = cleaned.trim();
  cleaned = cleaned.replace(/,(\s*[}\]])/g, "$1");
  return cleaned;
}

async function parseResumeFromPDF(
  pdfBuffer: Buffer,
  GEMINI_API_KEY: undefined | string,
): Promise<
  { success: true; data: Resume } | { success: false; error: string }
> {
  if (!ai) {
    if (GEMINI_API_KEY) {
      ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    } else {
      throw new Error(
        "Gemini API is not configured. Please set GEMINI_API_KEY environment variable.",
      );
    }
  }

  const pdfBase64 = pdfBuffer.toString("base64");

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      { text: SYSTEM_PROMPT },
      {
        inlineData: {
          mimeType: "application/pdf",
          data: pdfBase64,
        },
      },
    ],
    config: {
      temperature: 0.1,
      responseMimeType: "application/json",
    },
  });

  const text = response.text;

  if (!text) {
    throw new Error("Gemini returned empty response");
  }

  let parsedData: unknown;
  try {
    const cleanedText = cleanJsonResponse(text);
    parsedData = JSON.parse(cleanedText);
  } catch (e) {
    throw new Error(
      `Failed to parse Gemini response as JSON: ${e instanceof Error ? e.message : "Unknown error"}`,
    );
  }

  const result = v.safeParse(ResumeSchema, parsedData);
  if (result.success) {
    return { success: true, data: result.output };
  }
  return { success: false, error: "Unknown error occurred" };
}

export const parsePdf = async ({
  request,
  db,
  GEMINI_API_KEY,
}: {
  request: Request;
  db: Kysely<DatabaseSchema>;
  GEMINI_API_KEY: undefined | string;
}) => {
  try {
    const { jobId, pdfBase64 } = (await request.json()) as {
      jobId: string;
      pdfBase64: string;
    };

    if (!jobId || !pdfBase64) {
      console.error(
        "Missing jobId or pdfBase64 in background function request",
      );
      return new Response(
        JSON.stringify({ error: "Missing jobId or pdfBase64" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Check retry count
    const job = await db
      .selectFrom("pdf_jobs")
      .select(["retry_count"])
      .where("id", "=", jobId)
      .executeTakeFirst();

    if (!job) {
      console.error(`Job ${jobId} not found`);
      return new Response(JSON.stringify({ error: "Job not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Increment retry count
    const retryCount = job.retry_count + 1;
    await db
      .updateTable("pdf_jobs")
      .set({ retry_count: retryCount, updated_at: new Date().toISOString() })
      .where("id", "=", jobId)
      .execute();

    // Check if we've exceeded max retries (3)
    if (retryCount > 3) {
      await db
        .updateTable("pdf_jobs")
        .set({
          status: "failed",
          error: "Max retries exceeded",
          updated_at: new Date().toISOString(),
        })
        .where("id", "=", jobId)
        .execute();

      return new Response(JSON.stringify({ error: "Max retries exceeded" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse the PDF
    const pdfBuffer = Buffer.from(pdfBase64, "base64");
    const result = await parseResumeFromPDF(pdfBuffer, GEMINI_API_KEY);

    if (result.success) {
      // Store successful result
      await db
        .updateTable("pdf_jobs")
        .set({
          status: "completed",
          result: JSON.stringify(result.data),
          updated_at: new Date().toISOString(),
        })
        .where("id", "=", jobId)
        .execute();
      console.info(`Job ${jobId} completed successfully`);
    } else {
      // Store error result - this will trigger a retry by Netlify
      await db
        .updateTable("pdf_jobs")
        .set({
          error: result.error,
          updated_at: new Date().toISOString(),
        })
        .where("id", "=", jobId)
        .execute();
      console.error(`Job ${jobId} parsing failed: ${result.error}`);

      // Return error to trigger Netlify retry
      return new Response(JSON.stringify({ error: result.error }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Background function error:", errorMessage);

    // Try to update job status if we have a jobId
    try {
      const { jobId } = (await request.json()) as { jobId: string };
      if (jobId) {
        await db
          .updateTable("pdf_jobs")
          .set({
            status: "failed",
            error: errorMessage,
            updated_at: new Date().toISOString(),
          })
          .where("id", "=", jobId)
          .execute();
      }
    } catch {
      // Ignore errors in error handling
    }

    // Return error to trigger Netlify retry
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export default async (request: Request) => {
  const db = createDB();
  const response = await parsePdf({
    request,
    db,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  });
  await db.destroy();
  return response;
};
