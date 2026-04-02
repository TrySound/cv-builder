import * as v from "valibot";
import { GoogleGenAI } from "@google/genai";
import { json } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";
import { type Resume, ResumeSchema } from "$lib/resume-schema";
import schemaString from "$lib/resume-schema?raw";

const MAX_FILE_SIZE = 500 * 1024; // 500kB

const GEMINI_API_KEY = env.GEMINI_API_KEY;

const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

const SYSTEM_PROMPT = `You are a resume parser. Extract structured information from the provided PDF resume and return JSON matching these TypeScript interfaces:

${schemaString}

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

/**
 * Clean common JSON syntax errors from LLM responses
 */
function cleanJsonResponse(text: string): string {
  // Remove markdown code block markers if present
  let cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "");

  // Trim whitespace
  cleaned = cleaned.trim();

  // Remove trailing commas before closing brackets/braces
  // This regex removes commas that appear right before } or ]
  cleaned = cleaned.replace(/,(\s*[}\]])/g, "$1");

  return cleaned;
}

async function parseResumeFromPDF(
  pdfBuffer: ArrayBuffer,
): Promise<
  { success: true; data: Resume } | { success: false; error: string }
> {
  if (!ai) {
    throw new Error(
      "Gemini API is not configured. Please set GEMINI_API_KEY environment variable.",
    );
  }

  const pdfBase64 = Buffer.from(pdfBuffer).toString("base64");

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

  // Clean and parse the JSON response
  let parsedData: unknown;
  try {
    // Clean common JSON syntax errors
    const cleanedText = cleanJsonResponse(text);
    parsedData = JSON.parse(cleanedText);
  } catch (e) {
    throw new Error(
      `Failed to parse Gemini response as JSON: ${e instanceof Error ? e.message : "Unknown error"}`,
    );
  }

  // Validate with valibot
  const result = v.safeParse(ResumeSchema, parsedData);
  if (result.success) {
    return { success: true, data: result.output };
  }
  return { success: false, error: "Unknown error occurred" };
}

export const POST = async ({ request }) => {
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

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Parse with Gemini
    const result = await parseResumeFromPDF(arrayBuffer);

    if (!result.success) {
      return json(
        { error: `Failed to parse resume: ${result.error}` },
        { status: 422 },
      );
    }

    return json({ resume: result.data });
  } catch (error) {
    console.error("PDF parsing error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return json({ error: `Server error: ${message}` }, { status: 500 });
  }
};
