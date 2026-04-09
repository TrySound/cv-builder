import * as v from "valibot";
import { GoogleGenAI } from "@google/genai";
import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import { type Resume, ResumeSchema } from "../../src/lib/jsonresume";
import type { DatabaseSchema } from "../../src/lib/db";

let ai: undefined | GoogleGenAI;

const SYSTEM_PROMPT = `You are a resume parser. Extract structured information from the provided PDF resume and return JSON matching the JSON Resume schema (https://jsonresume.org).

TypeScript interfaces:

export type ISO8601 = string; // YYYY or YYYY-MM or YYYY-MM-DD

export type EmploymentType = "fulltime" | "parttime" | "contract" | "freelance" | "internship";

export type WorkplaceType = "onsite" | "remote" | "hybrid";

export interface Profile {
  network?: string;
  username?: string;
  url: string;
}

export interface Location {
  address?: string;
  postalCode?: string;
  city?: string;
  countryCode?: string;
  region?: string;
}

export interface Basics {
  name?: string;
  label?: string; // headline
  image?: string;
  email?: string;
  phone?: string;
  url?: string; // website
  summary?: string;
  location?: Location;
  profiles?: Profile[];
}

export interface Work {
  name?: string; // company
  location?: string;
  description?: string;
  position?: string; // title
  url?: string;
  startDate?: ISO8601;
  endDate?: ISO8601;
  summary?: string;
  highlights?: string[];
  extension?: {
    employmentType?: EmploymentType;
    workplaceType?: WorkplaceType;
  };
}

export interface Education {
  institution?: string;
  url?: string;
  area?: string; // field of study
  studyType?: string; // degree
  startDate?: ISO8601;
  endDate?: ISO8601;
  score?: string;
  courses?: string[];
  extension?: {
    description?: string;
  };
}

export interface Project {
  name?: string;
  description?: string;
  highlights?: string[];
  keywords?: string[];
  startDate?: ISO8601;
  endDate?: ISO8601;
  url?: string;
  roles?: string[];
  entity?: string;
  type?: string;
}

export interface Skill {
  name?: string;
  level?: string;
  keywords?: string[];
}

export interface Language {
  language?: string;
  fluency?: string;
}

export interface Resume {
  $schema?: string;
  basics?: Basics;
  work?: Work[];
  education?: Education[];
  projects?: Project[];
  skills?: Skill[];
  languages?: Language[];
  extension?: {
    industry?: string;
    preferredWorkplaces?: WorkplaceType[];
  };
  meta?: {
    lastModified?: string;
  };
}

CRITICAL RULES:
1. Return ONLY valid JSON matching JSON Resume schema - no markdown, no code blocks
2. Preserve formatting of paragraphs using newlines
3. Preserve formatting of lists using "-"
4. Optional fields should be omitted entirely if data is missing - NEVER use null
5. NEVER include trailing commas in arrays or objects
6. Use empty arrays [] for work, education, projects, skills, languages if none found
7. For current positions, omit endDate field entirely (never set to null)
8. Dates: Always use partial ISO8601 format WITHOUT the day component:
    - YYYY format when only year is known (e.g., "2020")
    - YYYY-MM format when month is known (e.g., "2020-06")
    - IMPORTANT: If a resume shows a full date like "2020-01-15", trim the day and return "2020-01"
    - Never include the day component in date fields
9. Ensure all quotes, brackets, and braces are properly closed
10. Extract all available information from the resume
11. Infer workplaceType and employmentType from job descriptions when possible
12. label field in basics is for title like "Senior full-stack engineer"
13. Use extension.preferredWorkplaces for workplace preferences (onsite/remote/hybrid)
14. Use extension.industry for industry field
15. Store work description as "description" string. Avoid using highlights array.
16. Put skills into array of objects { name }. Avoid using keywords for this.

EXAMPLE VALID OUTPUT:
{
  "basics": {
    "name": "John Doe",
    "label": "Senior Software Engineer",
    "email": "john@example.com",
    "url": "https://johndoe.com",
    "summary": "Experienced software engineer with 5+ years...",
    "location": {
      "address": "Mountain View, CA"
    },
    "profiles": [
      { "network": "LinkedIn", "url": "https://linkedin.com/in/johndoe" },
      { "network": "GitHub", "url": "https://github.com/johndoe" }
    ]
  },
  "work": [
    {
      "name": "Google",
      "position": "Software Engineer",
      "location": "Mountain View, CA",
      "startDate": "2020-01",
      "endDate": "2023-06",
      "summary": "Developed scalable web applications",
      "extension": {
        "employmentType": "fulltime",
        "workplaceType": "hybrid"
      }
    }
  ],
  "education": [],
  "projects": [],
  "skills": [
    { "name": "TypeScript" },
    { "name": "React" },
    { "name": "Node.js" }
  ],
  "languages": [
    { "language": "English" }
  ],
  "extension": {
    "industry": "Technology",
    "preferredWorkplaces": ["hybrid", "remote"]
  }
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
  let jobId: string | null = null;

  try {
    const { jobId: extractedJobId, pdfBase64 } = (await request.json()) as {
      jobId: string;
      pdfBase64: string;
    };
    jobId = extractedJobId;

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

    // Update job status if we have a jobId
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
