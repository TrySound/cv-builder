import { getDB } from "./db";
import type {
  Resume,
  Work,
  Education,
  WorkplaceType,
  EmploymentType,
} from "./jsonresume";

export async function loadResume(handle: string): Promise<Resume | undefined> {
  const db = await getDB();

  // Get target member
  const targetMember = await db
    .selectFrom("members")
    .selectAll()
    .where("handle", "=", handle)
    .executeTakeFirst();

  if (!targetMember) {
    return;
  }

  // Load all related data
  const [positions, education, projects, skills, languages, workplaces] =
    await Promise.all([
      db
        .selectFrom("member_positions")
        .selectAll()
        .where("did", "=", targetMember.did)
        .execute(),
      db
        .selectFrom("member_education")
        .selectAll()
        .where("did", "=", targetMember.did)
        .execute(),
      db
        .selectFrom("member_projects")
        .selectAll()
        .where("did", "=", targetMember.did)
        .execute(),
      db
        .selectFrom("member_skills")
        .select("skill")
        .where("did", "=", targetMember.did)
        .execute(),
      db
        .selectFrom("member_languages")
        .select("language")
        .where("did", "=", targetMember.did)
        .execute(),
      db
        .selectFrom("member_preferred_workplaces")
        .select("workplace_type")
        .where("did", "=", targetMember.did)
        .execute(),
    ]);

  // Build profiles array from linkedin and github
  const profiles = [];
  if (targetMember.linkedin) {
    profiles.push({
      network: "LinkedIn",
      url: targetMember.linkedin,
    });
  }
  if (targetMember.github) {
    profiles.push({
      network: "GitHub",
      url: targetMember.github,
    });
  }

  // Build extension with custom fields (only non-position data)
  const extension: Resume["extension"] = {
    industry: targetMember.industry ?? undefined,
    preferredWorkplaces: workplaces.map(
      (w) => w.workplace_type as WorkplaceType,
    ),
  };

  const location = targetMember.location
    ? { address: targetMember.location }
    : undefined;

  const work: Work[] = positions.map((p) => {
    const workEntry: Work = {
      name: p.company,
      location: p.location ?? undefined,
      position: p.title,
      startDate: p.started_at ?? undefined,
      endDate: p.ended_at ?? undefined,
      summary: p.description ?? undefined,
    };

    // Add extension only if there are custom fields
    if (p.employment_type || p.workplace_type) {
      workEntry.extension = {
        employmentType: (p.employment_type as EmploymentType) ?? undefined,
        workplaceType: (p.workplace_type as WorkplaceType) ?? undefined,
      };
    }

    return workEntry;
  });

  const educationList: Education[] = education.map((e) => {
    const eduEntry: Education = {
      institution: e.institution,
      area: e.field ?? undefined,
      studyType: e.degree,
      startDate: e.started_at ?? undefined,
      endDate: e.ended_at ?? undefined,
    };

    if (e.description) {
      eduEntry.extension = { description: e.description };
    }

    return eduEntry;
  });

  const resume: Resume = {
    $schema:
      "https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json",
    basics: {
      name: targetMember.name ?? undefined,
      label: targetMember.headline ?? undefined,
      email: targetMember.email ?? undefined,
      url: targetMember.website ?? undefined,
      summary: targetMember.summary ?? undefined,
      location,
      profiles: profiles.length > 0 ? profiles : undefined,
    },
    work: work.length > 0 ? work : undefined,
    education: educationList.length > 0 ? educationList : undefined,
    projects:
      projects.length > 0
        ? projects.map((p) => ({
          name: p.name,
          description: p.description ?? undefined,
          url: p.url ?? undefined,
          startDate: p.started_at ?? undefined,
          endDate: p.ended_at ?? undefined,
        }))
        : undefined,
    skills:
      skills.length > 0 ? skills.map((s) => ({ name: s.skill })) : undefined,
    languages:
      languages.length > 0
        ? languages.map((l) => ({ language: l.language }))
        : undefined,
    meta: {
      lastModified: new Date().toISOString(),
    },
    extension: Object.keys(extension).length > 0 ? extension : undefined,
  };

  return resume;
}
