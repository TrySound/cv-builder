import { redirect, error } from "@sveltejs/kit";
import type { HandleString } from "@atproto/lex";
import { getDB } from "$lib/db";
import type { EmploymentType, Resume, WorkplaceType } from "$lib/cv-parser";
import { handleResolver } from "$lib/auth.js";

export const load = async ({ params, locals }) => {
  const currentDid = locals.did;
  if (!currentDid) {
    redirect(302, "/login");
  }

  // Verify current user is a member
  const db = await getDB();
  const currentMember = await db
    .selectFrom("members")
    .select("did")
    .where("did", "=", currentDid)
    .executeTakeFirst();

  if (!currentMember) {
    redirect(302, "/unauthorized");
  }

  // Get the handle from params
  const handle = params.handle as HandleString;
  const did = await handleResolver.resolve(handle);

  try {
    // Verify target is also a member
    const targetMember = await db
      .selectFrom("members")
      .selectAll()
      .where("did", "=", did)
      .executeTakeFirst();

    if (!targetMember) {
      error(404, "Member not found");
    }

    // Load all related data
    const [positions, education, projects, skills, languages, workplaces] =
      await Promise.all([
        db
          .selectFrom("member_positions")
          .selectAll()
          .where("did", "=", did)
          .execute(),
        db
          .selectFrom("member_education")
          .selectAll()
          .where("did", "=", did)
          .execute(),
        db
          .selectFrom("member_projects")
          .selectAll()
          .where("did", "=", did)
          .execute(),
        db
          .selectFrom("member_skills")
          .select("skill")
          .where("did", "=", did)
          .execute(),
        db
          .selectFrom("member_languages")
          .select("language")
          .where("did", "=", did)
          .execute(),
        db
          .selectFrom("member_preferred_workplaces")
          .select("workplace_type")
          .where("did", "=", did)
          .execute(),
      ]);

    const resume: Resume = {
      profile: {
        name: targetMember.name ?? "",
        email: targetMember.email ?? undefined,
        location: targetMember.location ?? undefined,
        headline: targetMember.headline ?? undefined,
        summary: targetMember.summary ?? undefined,
        industry: targetMember.industry ?? undefined,
        linkedin: targetMember.linkedin ?? undefined,
        github: targetMember.github ?? undefined,
        website: targetMember.website ?? undefined,
      },
      positions: positions.map((p) => ({
        company: p.company,
        title: p.title,
        location: p.location ?? undefined,
        workplaceType: (p.workplace_type ?? undefined) as
          | WorkplaceType
          | undefined,
        employmentType: (p.employment_type ?? undefined) as
          | EmploymentType
          | undefined,
        description: p.description ?? undefined,
        startedAt: p.started_at ?? undefined,
        endedAt: p.ended_at ?? undefined,
      })),
      education: education.map((e) => ({
        institution: e.institution,
        degree: e.degree,
        field: e.field ?? undefined,
        description: e.description ?? undefined,
        startedAt: e.started_at ?? undefined,
        endedAt: e.ended_at ?? undefined,
      })),
      projects: projects.map((p) => ({
        name: p.name,
        description: p.description ?? undefined,
        url: p.url ?? undefined,
        startedAt: p.started_at ?? undefined,
        endedAt: p.ended_at ?? undefined,
      })),
      preferredWorkplace: workplaces.map(
        (w) => w.workplace_type as WorkplaceType,
      ),
      skills: skills.map((s) => s.skill),
      languages: languages.map((l) => l.language),
    };

    return {
      handle,
      resume,
      isOwnProfile: currentDid === did,
    };
  } catch (e) {
    error(404, "Profile not found");
  }
};
