import { redirect, error, fail } from "@sveltejs/kit";
import type { HandleString } from "@atproto/lex";
import { sql } from "kysely";
import { getDB } from "$lib/db";
import type { EmploymentType, Resume, WorkplaceType } from "$lib/cv-parser";

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

  // Verify target is also a member
  const targetMember = await db
    .selectFrom("members")
    .selectAll()
    .where("handle", "=", handle)
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

  // Load recommendations with inviter info
  const recommendations = await db
    .selectFrom("recommendations")
    .innerJoin("members", "recommendations.author_did", "members.did")
    .where("recommendations.subject_did", "=", targetMember.did)
    .orderBy(
      sql`CASE WHEN recommendations.invitation_id IS NOT NULL THEN 0 ELSE 1 END`,
      "asc",
    )
    .orderBy("recommendations.created_at", "desc")
    .select([
      "recommendations.text",
      "recommendations.invitation_id",
      "recommendations.created_at",
      "members.name as author_name",
      "members.handle as author_handle",
    ])
    .execute();

  // Get inviter info if member was invited
  let inviter = null;
  if (targetMember.invited_by) {
    const inviterData = await db
      .selectFrom("members")
      .select(["name", "did"])
      .where("did", "=", targetMember.invited_by)
      .executeTakeFirst();

    if (inviterData) {
      inviter = {
        name: inviterData.name,
        handle: inviterData.did,
      };
    }
  }

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

  // Check if current user has already recommended this profile
  const hasRecommended = await db
    .selectFrom("recommendations")
    .select("id")
    .where("author_did", "=", currentDid)
    .where("subject_did", "=", targetMember.did)
    .executeTakeFirst()
    .then((result) => result !== undefined);

  return {
    handle,
    resume,
    isOwnProfile: currentDid === targetMember.did,
    recommendations: recommendations.map((rec) => ({
      text: rec.text,
      authorName: rec.author_name,
      authorHandle: rec.author_handle,
      createdAt: rec.created_at,
      isFromInvite: rec.invitation_id !== null,
    })),
    inviter: inviter
      ? {
        name: inviter.name,
        handle: inviter.handle,
      }
      : null,
    hasRecommended,
  };
};

export const actions = {
  recommend: async ({ request, params, locals }) => {
    if (!locals.did) {
      return fail(401, { error: "Not authenticated" });
    }

    const handle = params.handle as HandleString;

    const db = await getDB();

    // Verify target is also a member
    const targetMember = await db
      .selectFrom("members")
      .select(["handle", "did"])
      .where("handle", "=", handle)
      .executeTakeFirst();

    if (!targetMember) {
      return fail(404, { error: "Member not found" });
    }

    // Prevent self-recommendations
    if (locals.did === targetMember.did) {
      return fail(400, { error: "Cannot recommend yourself" });
    }

    // Check if already recommended
    const existingRecommendation = await db
      .selectFrom("recommendations")
      .select("id")
      .where("author_did", "=", locals.did)
      .where("subject_did", "=", targetMember.did)
      .executeTakeFirst();

    if (existingRecommendation) {
      return fail(400, { error: "Already recommended this member" });
    }

    const formData = await request.formData();
    const text = formData.get("text")?.toString().trim() ?? "";

    // Create the recommendation (without invitation_id)
    await db
      .insertInto("recommendations")
      .values({
        author_did: locals.did,
        subject_did: targetMember.did,
        text,
      })
      .execute();

    return { success: true };
  },
};
