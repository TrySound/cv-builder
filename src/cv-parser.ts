export interface ContactInfo {
  name?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  github?: string;
  website?: string;
  location?: string;
}

export interface Education {
  institution?: string;
  degree?: string;
  field?: string;
  dateRange?: { start?: string; end?: string };
  description?: string;
}

export interface Skill {
  skill: string;
  category: string;
}

export interface Experience {
  title?: string;
  company?: string;
  location?: string;
  dateRange?: { start?: string; end?: string };
  description?: string;
}

export interface Project {
  name?: string;
  description?: string;
  dateRange?: { start?: string; end?: string };
}

export interface Resume {
  contact: ContactInfo;
  summary?: string;
  skills: string[];
  experience: Experience[];
  education: Education[];
  projects: Project[];
}

interface Section {
  type: SectionType;
  content: string;
  startLine: number;
}

const unicodeMap: Record<string, string> = {
  // smart single quotes
  "\u2018": "'",
  "\u2019": "'",
  // smart double quotes
  "\u201C": '"',
  "\u201D": '"',
  // en/em dashes
  "\u2013": "-",
  "\u2014": "-",
  // bullets
  "\u2022": "-",
  "\u00B7": "-",
};

function normalizeText(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n") // normalize line endings
    .replace(/[ ]{2,}/g, " ") // collapse multiple spaces
    .replace(/\t/g, "  ") // tabs → double spaces
    .replace(/\n{3,}/g, "\n\n") // collapse excessive blank lines
    .replace(
      /[^\x00-\x7F]/g,
      (
        c, // normalize unicode punctuation
      ) => unicodeMap[c] ?? c,
    )
    .trim();
}

type SectionType =
  | "contact"
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "certifications"
  | "projects"
  | "unknown";

const SECTION_PATTERNS: Record<SectionType, RegExp[]> = {
  contact: [/^(contact|personal info|reach me)/i],
  summary: [
    /^(professional summary|summary|profile|objective|about me|overview)/i,
  ],
  experience: [
    /^(work experience|experience|work history|employment|career|positions? held)/i,
  ],
  education: [/^(education|academic|qualifications?|degrees?)/i],
  skills: [/^(skills?|technical skills?|core competencies|expertise)/i],
  certifications: [
    /^(certifications?|licenses?|credentials?|accreditations?)/i,
  ],
  projects: [/^(projects?|portfolio|work samples?)/i],
  unknown: [],
};

function detectSections(normalizedText: string): Section[] {
  const lines = normalizedText.split("\n");
  const sections: Section[] = [];
  let currentSection: Section | null = null;
  let contentLines: string[] = [];

  const isSectionHeader = (line: string): SectionType | null => {
    const trimmed = line.trim();
    // Heuristic: headers are short lines (< 40 chars), possibly ALL CAPS or title case
    if (trimmed.length === 0 || trimmed.length > 60) return null;

    for (const [type, patterns] of Object.entries(SECTION_PATTERNS)) {
      if (type === "unknown") continue;
      if (patterns.some((p) => p.test(trimmed))) {
        return type as SectionType;
      }
    }

    // ALL CAPS short line = likely a header even if not in dictionary
    if (/^[A-Z\s&/\-]{4,40}$/.test(trimmed)) return "unknown";

    return null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const detectedType = isSectionHeader(line);

    if (detectedType !== null) {
      if (currentSection) {
        currentSection.content = contentLines.join("\n").trim();
        sections.push(currentSection);
      }
      currentSection = {
        type: detectedType,
        content: "",
        startLine: i,
      };
      contentLines = [];
    } else if (currentSection) {
      contentLines.push(line);
    } else {
      // Text before first section → treat as contact/header block
      if (!currentSection && line.trim().length > 0) {
        currentSection = {
          type: "contact",
          content: "",
          startLine: i,
        };
        contentLines = [line];
      }
    }
  }

  if (currentSection) {
    currentSection.content = contentLines.join("\n").trim();
    sections.push(currentSection);
  }

  return sections;
}

function extractContact(text: string): ContactInfo {
  // Extract name: look for the first line that looks like a name
  // Name patterns: Title case (1-3 words) or ALL CAPS (1-3 words)
  // Exclude lines with emails, URLs, or phone numbers
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  let name: string | undefined;

  for (const line of lines) {
    // Skip lines with emails, URLs, phone numbers
    if (
      line.includes("@") ||
      /https?:\/\//.test(line) ||
      /\b\d{3}[-.) ]\d{3}[-. ]\d{4}\b/.test(line)
    ) {
      continue;
    }

    // Match title case names (John Smith, Jane Marie Doe)
    const titleCaseMatch = line.match(/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}$/);
    if (titleCaseMatch) {
      name = titleCaseMatch[0];
      break;
    }

    // Match all caps names (ALEXANDER CHEN, JANE DOE)
    const allCapsMatch = line.match(/^[A-Z]{2,}(?:\s+[A-Z]{2,}){0,2}$/);
    if (allCapsMatch && allCapsMatch[0].length > 3) {
      name = allCapsMatch[0];
      break;
    }
  }

  return {
    name,
    email: text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-z]{2,}/)?.[0],
    phone: text.match(
      /(\+?1[\s.\-])?(\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4})/,
    )?.[0],
    linkedin: text.match(/linkedin\.com\/in\/([a-zA-Z0-9\-_%]+)/)?.[0],
    github: text.match(/github\.com\/([a-zA-Z0-9\-_%]+)/)?.[0],
    website: text.match(/https?:\/\/(?!linkedin|github)[^\s]+/)?.[0],
  };
}

function extractSummary(text: string): string | undefined {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // Summary is typically a paragraph of 1-3 sentences, not bullet points
  // Skip lines that look like headers, bullets, or contact info
  const summaryLines: string[] = [];
  for (const line of lines) {
    // Skip empty, very short, bullet, or URL lines
    if (
      line.length < 20 ||
      /^[-•*·▪]/.test(line) ||
      /^https?:\/\//.test(line) ||
      /^[A-Z\s&/\-]{4,40}$/.test(line) // ALL CAPS headers
    ) {
      continue;
    }
    // Stop at common section-start patterns
    if (
      /^(skills?|experience|education|projects?|certifications?)\s*$/i.test(
        line,
      )
    ) {
      break;
    }
    summaryLines.push(line);
  }

  const summary = summaryLines.join(" ").trim();
  // Only return if it looks like prose (multiple words, proper sentence structure)
  if (summary.length > 40 && summary.split(/\s+/).length > 8) {
    return summary;
  }
  return undefined;
}

// --- Unified utilities ---

interface DateRange {
  start?: string;
  end?: string;
}

const DATE_RANGE_RE =
  /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\d{4})\s*[-–—to]+\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\d{4}|present|current|now)/gi;

const SINGLE_YEAR_RE = /\b(19|20)\d{2}\b/g;

const LOCATION_RE = /\b(remote|hybrid|on-?site|[A-Z][a-z]+,\s*[A-Z]{2})\b/i;

function extractDateFromLine(line: string): DateRange | undefined {
  DATE_RANGE_RE.lastIndex = 0;
  const rangeMatch = DATE_RANGE_RE.exec(line);
  if (rangeMatch) {
    return { start: rangeMatch[1], end: rangeMatch[2] };
  }
  SINGLE_YEAR_RE.lastIndex = 0;
  const yearMatch = SINGLE_YEAR_RE.exec(line);
  if (yearMatch) {
    return { start: yearMatch[0] };
  }
  return undefined;
}

function extractDateFromLines(lines: string[]): {
  dateRange?: DateRange;
  index: number;
} {
  for (let i = 0; i < lines.length; i++) {
    const dateRange = extractDateFromLine(lines[i]);
    if (dateRange) {
      return { dateRange, index: i };
    }
  }
  return { index: -1 };
}

function isHeaderLine(line: string, options?: { maxLength?: number }): boolean {
  const maxLength = options?.maxLength ?? 80;
  return (
    line.length < maxLength &&
    !/^[-•*·▪]/.test(line) &&
    !/^https?:\/\//.test(line)
  );
}

function isDescriptionLine(line?: string): boolean {
  return !line || line.length > 80 || /^[-•*·▪]/.test(line);
}

function stripPatterns(line: string, patterns: RegExp[]): string {
  let result = line;
  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    result = result.replace(pattern, "");
  }
  return result.trim();
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ---- Unified taxonomy ----
// In production, load this from EMSI/O*NET or a curated JSON file
export const SKILLS_TAXONOMY: Record<string, string[]> = {
  languages: [
    "typescript",
    "javascript",
    "python",
    "java",
    "c++",
    "c#",
    "go",
    "rust",
    "ruby",
    "swift",
    "kotlin",
    "php",
    "scala",
    "elixir",
    "haskell",
    "r",
  ],
  frameworks: [
    "react",
    "next.js",
    "nextjs",
    "vue",
    "nuxt",
    "angular",
    "svelte",
    "tailwind",
    "css",
    "html",
    "sass",
    "webpack",
    "vite",
    "node.js",
    "nodejs",
    "express",
    "fastapi",
    "django",
    "flask",
    "rails",
    "spring",
    "laravel",
    "nestjs",
    "hono",
    "elysia",
  ],
  databases: [
    "postgresql",
    "mysql",
    "mongodb",
    "redis",
    "sqlite",
    "dynamodb",
    "cassandra",
    "elasticsearch",
    "supabase",
    "planetscale",
    "turso",
  ],
  cloud: [
    "aws",
    "azure",
    "gcp",
    "google cloud",
    "cloudflare",
    "vercel",
    "heroku",
    "digitalocean",
  ],
  devops: [
    "docker",
    "kubernetes",
    "terraform",
    "ansible",
    "ci/cd",
    "github actions",
    "jenkins",
    "helm",
  ],
  ai_ml: [
    "openai",
    "langchain",
    "pytorch",
    "tensorflow",
    "huggingface",
    "scikit-learn",
    "pandas",
    "numpy",
  ],
  tools: [
    "graphql",
    "rest",
    "trpc",
    "grpc",
    "websocket",
    "prisma",
    "drizzle",
    "stripe",
    "twilio",
    "sendgrid",
  ],
};

function extractSkills(text: string): string[] {
  const lower = text.toLowerCase();
  const matched: string[] = [];

  for (const [_category, skills] of Object.entries(SKILLS_TAXONOMY)) {
    for (const skill of skills) {
      // Word-boundary aware matching
      const regex = new RegExp(`(?<![a-z])${escapeRegex(skill)}(?![a-z])`, "i");
      if (regex.test(lower)) {
        matched.push(skill);
      }
    }
  }

  return matched;
}

export function groupSkillsByCategory(skills: string[]): {
  [category: string]: string[];
} {
  const grouped: { [category: string]: string[] } = {};

  // Create reverse lookup map: skill -> category
  const skillToCategory: Record<string, string> = {};
  for (const [category, categorySkills] of Object.entries(SKILLS_TAXONOMY)) {
    for (const skill of categorySkills) {
      skillToCategory[skill.toLowerCase()] = category;
    }
  }

  for (const skill of skills) {
    const category = skillToCategory[skill.toLowerCase()] ?? "other";
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(skill);
  }

  return grouped;
}

export function createEmptyResume(): Resume {
  return {
    contact: {},
    summary: "",
    skills: [],
    experience: [],
    education: [],
    projects: [],
  };
}

function extractExperience(sectionContent: string): Experience[] {
  const blocks = splitIntoBlocks(sectionContent);
  return blocks.map(parseExperienceBlock);
}

/**
 * Split into entry blocks based on entry patterns.
 *
 * Experience entries: date line followed by bullets/description
 * Education entries: date line at end (not followed by description)
 * Empty lines: explicit block separator
 */
function splitIntoBlocks(text: string): string[] {
  const lines = text.split("\n");
  const blocks: string[] = [];
  let current: string[] = [];

  function flushBlock() {
    if (current.length > 0) {
      blocks.push(current.join("\n"));
      current = [];
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    // Empty lines are explicit block boundaries
    if (!trimmed) {
      flushBlock();
      continue;
    }

    const isDateLine =
      DATE_RANGE_RE.test(trimmed) || /\b(19|20)\d{2}\b/.test(trimmed);
    // Reset the regex lastIndex (it's global)
    DATE_RANGE_RE.lastIndex = 0;

    // Only split on date if it looks like experience pattern
    // (followed by description/bullet points)
    if (isDateLine && current.length > 0) {
      // Look ahead: if next line is a bullet or long line, it's experience
      // Otherwise it's education - date at end, don't split
      const nextLine = lines.slice(i + 1).find((l) => l.trim());
      if (nextLine && isDescriptionLine(nextLine.trim())) {
        flushBlock();
      }
    }

    current.push(trimmed);
  }

  flushBlock();

  return blocks.filter(Boolean);
}

function parseExperienceBlock(block: string): Experience {
  const lines = block
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // --- Date range: use unified utility ---
  const { dateRange, index: dateLineIndex } = extractDateFromLines(lines);

  // --- Title: the line containing the date range, stripped of the date ---
  const titleRaw =
    dateLineIndex >= 0
      ? lines[dateLineIndex].replace(DATE_RANGE_RE, "").trim()
      : lines[0];

  // --- Company line: the line immediately after the title line,
  //     if it doesn't look like a bullet or long description ---
  const companyLineIndex = dateLineIndex >= 0 ? dateLineIndex + 1 : 1;
  const companyRaw = lines[companyLineIndex];

  let company: string | undefined;
  let location: string | undefined;

  if (companyRaw && !isDescriptionLine(companyRaw)) {
    const parts = companyRaw
      .split(/\t|\s{2,}/) // split on tab OR any 2+ spaces (remove lookbehind)
      .map((p) => p.trim())
      .filter(Boolean);

    company = parts[0];

    // Use the second part if it looks like a location,
    // otherwise fall back to scanning the full string
    const locationCandidate = parts[1];
    location =
      locationCandidate && LOCATION_RE.test(locationCandidate)
        ? locationCandidate
        : companyRaw.match(LOCATION_RE)?.[0];
  }

  // --- Description: all lines after the header block as raw text ---
  const contentStartIndex =
    companyRaw && !isDescriptionLine(companyRaw)
      ? companyLineIndex + 1
      : companyLineIndex;

  const description = lines.slice(contentStartIndex).join("\n").trim();

  return {
    title: titleRaw || undefined,
    company,
    location,
    dateRange,
    description: description || undefined,
  };
}

const DEGREE_PATTERNS: { pattern: RegExp; normalized: string }[] = [
  {
    pattern: /\bb\.?s\.?c?\.?\b|bachelor[s']?\s+of\s+science/i,
    normalized: "Bachelor of Science",
  },
  {
    pattern: /\bb\.?a\.?\b|bachelor[s']?\s+of\s+arts/i,
    normalized: "Bachelor of Arts",
  },
  {
    pattern: /\bb\.?eng\.?\b|bachelor[s']?\s+of\s+eng/i,
    normalized: "Bachelor of Engineering",
  },
  {
    pattern: /\bm\.?s\.?c?\.?\b|master[s']?\s+of\s+science/i,
    normalized: "Master of Science",
  },
  {
    pattern: /\bm\.?a\.?\b|master[s']?\s+of\s+arts/i,
    normalized: "Master of Arts",
  },
  {
    pattern: /\bm\.?eng\.?\b|master[s']?\s+of\s+eng/i,
    normalized: "Master of Engineering",
  },
  {
    pattern: /\bm\.?b\.?a\.?\b/i,
    normalized: "Master of Business Administration",
  },
  {
    pattern: /\bph\.?d\.?\b|doctor\s+of\s+philosophy/i,
    normalized: "Doctor of Philosophy",
  },
  {
    pattern: /\ba\.?a\.?\b|associate[s']?\s+of\s+arts/i,
    normalized: "Associate of Arts",
  },
  {
    pattern: /\ba\.?s\.?\b|associate[s']?\s+of\s+science/i,
    normalized: "Associate of Science",
  },
];

// Common field-of-study keywords to help isolate field from degree line
const FIELD_INDICATORS = [
  "computer science",
  "software engineering",
  "information technology",
  "electrical engineering",
  "mechanical engineering",
  "business administration",
  "mathematics",
  "physics",
  "chemistry",
  "biology",
  "economics",
  "data science",
  "artificial intelligence",
  "cybersecurity",
  "finance",
  "accounting",
  "marketing",
  "psychology",
  "sociology",
];

function extractDegree(
  text: string,
): { degree: string; field?: string } | undefined {
  for (const { pattern, normalized } of DEGREE_PATTERNS) {
    if (pattern.test(text)) {
      // Try to find field of study after "in" or "of" following the degree
      const fieldMatch = text.match(
        /(?:in|of)\s+([A-Za-z\s&,]+?)(?:\s*[,.(]|$)/i,
      );
      if (fieldMatch) {
        return { degree: normalized, field: fieldMatch[1].trim() };
      }
      // Fall back to scanning known field keywords
      const lower = text.toLowerCase();
      const knownField = FIELD_INDICATORS.find((f) => lower.includes(f));
      return { degree: normalized, field: knownField };
    }
  }
  return undefined;
}

function parseEducationBlock(block: string): Education {
  const lines = block
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // --- Date range: use unified utility ---
  const { dateRange, index: dateLineIndex } = extractDateFromLines(lines);

  // --- Split into header (before date) and description (after date) ---
  // Lines before date are header candidates
  // Lines after date are description
  const preDateLines =
    dateLineIndex >= 0 ? lines.slice(0, dateLineIndex) : lines.slice(0, 2);
  const postDateLines =
    dateLineIndex >= 0 ? lines.slice(dateLineIndex + 1) : [];

  // --- Parse header: extract institution and degree ---
  let institution: string | undefined;
  let degree: string | undefined;
  let field: string | undefined;
  const descriptionLines: string[] = [...postDateLines];

  for (const line of preDateLines) {
    // Strip date from the line before further analysis
    const stripped = stripPatterns(line, [DATE_RANGE_RE, SINGLE_YEAR_RE]);

    // Try degree extraction first
    const degreeResult = extractDegree(stripped);
    if (degreeResult && !degree) {
      degree = degreeResult.degree;
      field = degreeResult.field;
      continue;
    }

    // Institution: first line that doesn't look like a description
    // (not too long, not starting with bullet)
    if (!institution && stripped.length > 0 && !isDescriptionLine(stripped)) {
      institution = stripPatterns(stripped, [/\s{2,}/g]);
    } else {
      // Everything else before the date goes to description
      descriptionLines.push(stripped);
    }
  }

  const description = descriptionLines.join("\n").trim();

  return {
    institution: institution || undefined,
    degree: degree || undefined,
    field: field || undefined,
    dateRange,
    description: description || undefined,
  };
}

function extractEducation(sectionContent: string): Education[] {
  const blocks = splitIntoBlocks(sectionContent);
  return blocks.map(parseEducationBlock);
}

// ---- Patterns ----

const LINK_RE = /https?:\/\/[^\s)>\]"]+/g;

// Parenthesised or bracketed tech lists: "Project Name (React, Node.js, PostgreSQL)"
const TECH_PARENS_RE = /[([]([\w\s,./#+\-]+)[)\]]/g;

// ---- Helpers ----

function parseProjectBlock(block: string): Project {
  const lines = block
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // --- Date range: use unified utility ---
  const { dateRange } = extractDateFromLines(lines);

  // --- Name: first non-bullet short line, stripped of date/links/parens ---
  const nameLine = lines.find((l) => isHeaderLine(l)) ?? lines[0];
  const name = stripPatterns(nameLine, [
    DATE_RANGE_RE,
    LINK_RE,
    TECH_PARENS_RE,
    /[|\-–—]\s*$/,
  ]);

  // --- Description: all non-header lines joined as raw text ---
  const nameLineIndex = lines.indexOf(nameLine);
  const description = lines
    .slice(nameLineIndex + 1)
    .join("\n")
    .trim();

  return {
    name: name || undefined,
    description: description || undefined,
    dateRange,
  };
}

function extractProjects(sectionContent: string): Project[] {
  const blocks = splitIntoBlocks(sectionContent);
  return blocks.map(parseProjectBlock);
}

export function parseResume(rawText: string): Resume {
  const normalized = normalizeText(rawText);
  const sections = detectSections(normalized);

  const getSection = (type: string) =>
    sections.find((s) => s.type === type)?.content ?? "";

  const skills = extractSkills(getSection("skills") + "\n" + normalized);
  const experience = extractExperience(getSection("experience"));
  const education = extractEducation(getSection("education"));
  const projects = extractProjects(getSection("projects"));
  const contact = extractContact(getSection("contact") + "\n" + normalized);
  const summary = extractSummary(getSection("summary"));

  return { contact, summary, skills, experience, education, projects };
}
