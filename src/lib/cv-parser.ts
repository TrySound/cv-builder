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
    "css",
    "html",
    "go",
    "rust",
    "ruby",
    "swift",
    "kotlin",
    "php",
    "sass",
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
