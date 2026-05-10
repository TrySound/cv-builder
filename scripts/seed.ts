import { nanoid } from "nanoid";
import { Kysely } from "kysely";
import type { DatabaseSchema } from "../src/lib/db.js";

const SKILLS = [
  "TypeScript",
  "JavaScript",
  "Python",
  "Go",
  "Rust",
  "React",
  "Svelte",
  "Vue",
  "Node.js",
  "PostgreSQL",
  "MongoDB",
  "AWS",
  "Docker",
  "Kubernetes",
  "GraphQL",
  "REST API",
  "Git",
  "CI/CD",
  "Testing",
  "Agile",
];

const NAMES = [
  "Emma Johnson",
  "Michael Chen",
  "Sarah Patel",
  "David Kim",
  "Lisa Rodriguez",
  "James Wilson",
  "Ana Garcia",
  "Robert Taylor",
  "Yuki Tanaka",
  "Maria Silva",
  "Thomas Anderson",
  "Priya Sharma",
  "Daniel Lee",
  "Sofia Martinez",
  "Alex Thompson",
  "Nina Kowalski",
  "Kevin Park",
  "Isabella Rossi",
  "Ryan Mitchell",
  "Mei Wong",
  "Christopher Brown",
  /*
  "Aisha Johnson",
  "Matthew Davis",
  "Lucia Fernandez",
  "Eric Zhang",
  "Olivia Martin",
  "Ahmed Hassan",
  "Jessica White",
  "Kenji Sato",
  "Rachel Green",
  "Andrew Clark",
  "Fatima Al-Rashid",
  "Brandon Lewis",
  "Elena Popov",
  "Samuel Wright",
  "Zara Ahmed",
  "Jonathan Baker",
  "Camila Santos",
  "Tyler Jones",
  "Yasmin Okafor",
  "Nicholas King",
  "Maya Desai",
  "Justin Moore",
  "Leila Farah",
  "Gregory Hall",
  "Sana Malik",
  "Derek Foster",
  "Amara Osei",
  "Jason Reed",
  */
];

const POSITIONS = [
  { title: "Software Engineer", company: "Stripe" },
  { title: "Senior Developer", company: "Netflix" },
  { title: "Full Stack Engineer", company: "Notion" },
  { title: "Frontend Developer", company: "Figma" },
  { title: "Backend Engineer", company: "Spotify" },
  { title: "DevOps Engineer", company: "Datadog" },
  { title: "Product Engineer", company: "Linear" },
  { title: "Staff Engineer", company: "Google" },
  { title: "Engineering Lead", company: "Shopify" },
  { title: "Tech Lead", company: "Airbnb" },
  { title: "Senior Frontend Engineer", company: "Vercel" },
  { title: "Platform Engineer", company: "Cloudflare" },
  { title: "Site Reliability Engineer", company: "GitHub" },
  { title: "Data Engineer", company: "Snowflake" },
  { title: "Mobile Engineer", company: "Robinhood" },
  { title: "Security Engineer", company: "1Password" },
  { title: "Infrastructure Engineer", company: "HashiCorp" },
  { title: "ML Engineer", company: "OpenAI" },
  { title: "Growth Engineer", company: "Figma" },
  { title: "Principal Engineer", company: "Slack" },
  { title: "Senior Full Stack", company: "GitLab" },
  { title: "Frontend Architect", company: "Adobe" },
  { title: "Backend Lead", company: "Uber" },
  { title: "Engineering Manager", company: "Dropbox" },
  { title: "Senior Software Engineer", company: "Square" },
];

const EDUCATION = [
  { institution: "Stanford University", degree: "BS Computer Science" },
  { institution: "MIT", degree: "MS Software Engineering" },
  { institution: "UC Berkeley", degree: "BS Computer Engineering" },
  { institution: "Carnegie Mellon", degree: "BS Information Systems" },
  { institution: "Georgia Tech", degree: "MS Computer Science" },
  { institution: "University of Washington", degree: "BS Computer Science" },
  { institution: "Caltech", degree: "BS Computer Science" },
  { institution: "Harvard University", degree: "BS Applied Math" },
];

const PROJECTS = [
  { name: "E-commerce Platform", description: "Built scalable marketplace" },
  { name: "Data Pipeline", description: "Real-time analytics system" },
  { name: "Mobile App", description: "Cross-platform React Native app" },
  { name: "API Gateway", description: "Microservices orchestration" },
  { name: "Dashboard", description: "Data visualization tool" },
  { name: "Chat System", description: "Real-time messaging platform" },
  { name: "CMS", description: "Content management system" },
  { name: "Search Engine", description: "Full-text search solution" },
];

const LOCATIONS = [
  { city: "San Francisco", state: "CA", country: "USA" },
  { city: "New York", state: "NY", country: "USA" },
  { city: "Seattle", state: "WA", country: "USA" },
  { city: "Austin", state: "TX", country: "USA" },
  { city: "Boston", state: "MA", country: "USA" },
  { city: "London", state: "", country: "UK" },
  { city: "Berlin", state: "", country: "Germany" },
  { city: "Toronto", state: "ON", country: "Canada" },
  { city: "Amsterdam", state: "", country: "Netherlands" },
  { city: "Singapore", state: "", country: "Singapore" },
];

function generateEmailFromName(name: string): string {
  const normalized = name.toLowerCase().replace(/\s+/g, ".");
  return `${normalized}@example.com`;
}

function generateHandleFromName(name: string): string {
  const normalized = name.toLowerCase().replace(/\s+/g, ".");
  return `${normalized}.example.com`;
}

function generateGitHubFromName(name: string): string {
  const normalized = name.toLowerCase().replace(/\s+/g, "-");
  return `https://github.com/${normalized}-dev`;
}

function generateLinkedInFromName(name: string): string {
  const normalized = name.toLowerCase().replace(/\s+/g, "-");
  return `https://linkedin.com/in/${normalized}-dev`;
}

export async function seedDatabase(db: Kysely<DatabaseSchema>) {
  const existingCount = await db
    .selectFrom("members")
    .select(db.fn.count("did").as("count"))
    .executeTakeFirst();

  if (existingCount && Number(existingCount.count) > 0) {
    console.log("Database already has members, skipping seed");
    return;
  }

  console.log("Seeding database with 50 members...");

  const now = new Date().toISOString();
  const members: DatabaseSchema["members"][] = [];

  const rootDid = "did:web:johndoe.io";
  const rootMember: DatabaseSchema["members"] = {
    did: rootDid,
    handle: "johndoe.io",
    name: "John Doe",
    email: "john@johndoe.io",
    location: "San Francisco, CA",
    headline: "Full Stack Developer & Open Source Enthusiast",
    summary:
      "Passionate about building great products and helping others grow in their careers.",
    industry: "Technology",
    linkedin: "https://linkedin.com/in/johndoe",
    github: "https://github.com/johndoe",
    website: "https://johndoe.io",
    invited_by: rootDid,
    created_at: now,
  };
  members.push(rootMember);

  // Create 49 fake members with organic branching
  for (let i = 1; i <= NAMES.length; i++) {
    const inviterIndex = Math.floor(Math.random() * members.length);
    const inviter = members[inviterIndex];
    const name = NAMES[i - 1];
    const handle = generateHandleFromName(name);
    const did = `did:web:${handle}`;
    const pos = POSITIONS[i % POSITIONS.length];
    const loc = LOCATIONS[i % LOCATIONS.length];
    const location = loc.state
      ? `${loc.city}, ${loc.state}`
      : `${loc.city}, ${loc.country}`;

    const member: DatabaseSchema["members"] = {
      did,
      handle,
      name,
      email: generateEmailFromName(name),
      location,
      headline: `${pos.title} at ${pos.company}`,
      summary: `Experienced ${pos.title.toLowerCase()} with ${Math.floor(Math.random() * 8) + 2} years in the industry. Passionate about building scalable solutions and collaborating with great teams.`,
      industry: "Technology",
      linkedin: generateLinkedInFromName(name),
      github: generateGitHubFromName(name),
      website: i % 3 === 0 ? `https://${handle.split(".")[0]}.dev` : null,
      invited_by: inviter.did,
      created_at: now,
    };

    members.push(member);
  }

  // Insert members
  await db.insertInto("members").values(members).execute();
  console.log(`Inserted ${members.length} members`);

  // Insert profiles (GitHub and LinkedIn URLs)
  const profiles: DatabaseSchema["member_profiles"][] = [];
  members.forEach((member) => {
    if (member.linkedin) {
      profiles.push({
        did: member.did,
        url: member.linkedin,
      });
    }
    if (member.github) {
      profiles.push({
        did: member.did,
        url: member.github,
      });
    }
  });
  if (profiles.length > 0) {
    await db.insertInto("member_profiles").values(profiles).execute();
    console.log(`Inserted ${profiles.length} profile URLs`);
  }

  // Insert positions
  const positions: DatabaseSchema["member_positions"][] = members
    .slice(1)
    .map((member, i) => {
      const pos = POSITIONS[i % POSITIONS.length];
      const startYear = 2020 + (i % 4);
      return {
        did: member.did,
        title: pos.title,
        company: pos.company,
        location: member.location,
        started_at: `${startYear}-01-01`,
        ended_at: i % 5 === 0 ? `${startYear + 2}-12-31` : null,
        description: `Working on exciting projects at ${pos.company}. Building scalable solutions and collaborating with talented teams.`,
        employment_type: ["FULL_TIME", "CONTRACT", "FREELANCE"][i % 3],
        workplace_type: ["ONSITE", "REMOTE", "HYBRID"][i % 3],
      };
    });
  await db.insertInto("member_positions").values(positions).execute();
  console.log(`Inserted ${positions.length} positions`);

  // Insert education
  const educations: DatabaseSchema["member_education"][] = members
    .slice(1)
    .map((member, i) => {
      const edu = EDUCATION[i % EDUCATION.length];
      return {
        did: member.did,
        institution: edu.institution,
        degree: edu.degree,
        started_at: `${2010 + (i % 8)}-09-01`,
        ended_at: `${2014 + (i % 8)}-05-31`,
        field: null,
        description: null,
      };
    });
  await db.insertInto("member_education").values(educations).execute();
  console.log(`Inserted ${educations.length} education records`);

  // Insert skills
  const skills: DatabaseSchema["member_skills"][] = [];
  members.slice(1).forEach((member, i) => {
    const numSkills = 3 + (i % 5);
    for (let j = 0; j < numSkills; j++) {
      const skillIndex = (i + j) % SKILLS.length;
      skills.push({
        did: member.did,
        skill: SKILLS[skillIndex],
      });
    }
  });
  await db.insertInto("member_skills").values(skills).execute();
  console.log(`Inserted ${skills.length} skills`);

  // Insert projects
  const projects: DatabaseSchema["member_projects"][] = members
    .slice(1)
    .map((member, i) => {
      const proj = PROJECTS[i % PROJECTS.length];
      const handlePrefix = member.handle.split(".")[0];
      return {
        did: member.did,
        name: proj.name,
        description: proj.description,
        url: `https://github.com/${handlePrefix}/${proj.name.toLowerCase().replace(/\s+/g, "-")}`,
        started_at: `${2020 + (i % 3)}-01-01`,
        ended_at: i % 4 === 0 ? `${2023 + (i % 2)}-12-31` : null,
      };
    });
  await db.insertInto("member_projects").values(projects).execute();
  console.log(`Inserted ${projects.length} projects`);

  // Create invitations and recommendations
  const invitations: DatabaseSchema["invitations"][] = [];
  const recommendations: DatabaseSchema["recommendations"][] = [];

  for (let i = 1; i < members.length; i++) {
    const member = members[i];
    const inviter = members.find((m) => m.did === member.invited_by)!;

    const code = nanoid(8);
    const invitation: DatabaseSchema["invitations"] = {
      id: crypto.randomUUID(),
      code,
      name: `Invite for ${member.name}`,
      created_by: inviter.did,
      recommendation_text: `${member.name} is a talented ${member.headline?.toLowerCase() || "professional"}. I've worked with them and can vouch for their technical skills and professionalism. They would be a great addition to our community.`,
      max_uses: 1,
      used_count: 1,
      created_at: now,
    };
    invitations.push(invitation);

    const recommendation: DatabaseSchema["recommendations"] = {
      id: crypto.randomUUID(),
      author_did: inviter.did,
      subject_did: member.did,
      text: invitation.recommendation_text,
      invitation_id: invitation.id,
      created_at: now,
    };
    recommendations.push(recommendation);
  }

  await db.insertInto("invitations").values(invitations).execute();
  console.log(`Inserted ${invitations.length} invitations`);

  await db.insertInto("recommendations").values(recommendations).execute();
  console.log(`Inserted ${recommendations.length} recommendations`);

  // Insert profile_index for each member
  const profileIndexes: DatabaseSchema["profile_index"][] = members.map((member) => {
    // Extract title from headline (e.g., "Software Engineer at Stripe" -> "Software Engineer")
    const titleMatch = member.headline?.match(/^(.+?)\s+at\s+/i);
    const title = titleMatch ? titleMatch[1] : member.headline;

    // Derive country_code from location
    let countryCode: string | null = null;
    if (member.location) {
      const parts = member.location.split(",").map((p) => p.trim());
      const lastPart = parts[parts.length - 1];
      // Map country names to ISO codes
      const countryMap: Record<string, string> = {
        "USA": "us",
        "UK": "gb",
        "Germany": "de",
        "Canada": "ca",
        "Netherlands": "nl",
        "Singapore": "sg",
      };
      countryCode = countryMap[lastPart] || null;
    }

    return {
      did: member.did,
      name: member.name,
      title: title || null,
      country_code: countryCode,
      introduction: member.summary || null,
      created_at: member.created_at ?? now,
    };
  });
  await db.insertInto("profile_index").values(profileIndexes).execute();
  console.log(`Inserted ${profileIndexes.length} profile_index records`);

  // Insert profile_private for each member
  const profilePrivates: DatabaseSchema["profile_private"][] = members.map((member) => {
    const statuses: Array<"open_to_work" | "open_to_connect" | "hidden"> = [
      "open_to_work",
      "open_to_connect",
      "hidden",
    ];
    // Use a deterministic status based on member index for consistency
    const status = statuses[member.did.length % 3];

    return {
      did: member.did,
      email: member.email,
      status,
      created_at: member.created_at,
      updated_at: member.created_at,
    };
  });
  await db.insertInto("profile_private").values(profilePrivates).execute();
  console.log(`Inserted ${profilePrivates.length} profile_private records`);

  // Insert recommendation_index for each recommendation
  const recommendationIndexes: DatabaseSchema["recommendation_index"][] =
    recommendations.map((rec) => ({
      uri: `at://did:web:${rec.author_did}/recommendation/${rec.id}`,
      author_did: rec.author_did,
      subject_did: rec.subject_did,
      reason: rec.text,
      created_at: rec.created_at ?? now,
    }));
  await db
    .insertInto("recommendation_index")
    .values(recommendationIndexes)
    .execute();
  console.log(`Inserted ${recommendationIndexes.length} recommendation_index records`);

  console.log("✓ Seeding completed successfully!");
  console.log("\nSample invitation codes:");
  invitations.slice(0, 5).forEach((inv) => {
    console.log(
      `  ${inv.code} -> ${members.find((m) => m.invited_by === inv.created_by)?.name || "johndoe.io"}`,
    );
  });
}
