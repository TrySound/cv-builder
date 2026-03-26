import { json } from "@sveltejs/kit";
import { getDB } from "$lib/db";
import type { Resume } from "$lib/cv-parser";

export const POST = async ({ request, locals }) => {
  const did = locals.did;
  if (!did) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await request.json();
  const resume: Resume = data.resume;

  if (!resume) {
    return json({ error: "Resume data required" }, { status: 400 });
  }

  const db = await getDB();

  await db.transaction().execute(async (trx) => {
    // Update member profile
    await trx
      .updateTable("members")
      .set({
        name: resume.profile.name || null,
        email: resume.profile.email || null,
        location: resume.profile.location || null,
        headline: resume.profile.headline || null,
        summary: resume.profile.summary || null,
        industry: resume.profile.industry || null,
        linkedin: resume.profile.linkedin || null,
        github: resume.profile.github || null,
        website: resume.profile.website || null,
        updated_at: new Date().toISOString(),
      })
      .where("did", "=", did)
      .execute();

    // Delete existing related records
    await trx.deleteFrom("member_positions").where("did", "=", did).execute();
    await trx.deleteFrom("member_education").where("did", "=", did).execute();
    await trx.deleteFrom("member_projects").where("did", "=", did).execute();
    await trx.deleteFrom("member_skills").where("did", "=", did).execute();
    await trx.deleteFrom("member_languages").where("did", "=", did).execute();
    await trx
      .deleteFrom("member_preferred_workplaces")
      .where("did", "=", did)
      .execute();

    if (resume.positions?.length > 0) {
      await trx
        .insertInto("member_positions")
        .values(
          resume.positions.map((p) => ({
            did,
            company: p.company,
            title: p.title,
            location: p.location || null,
            workplace_type: p.workplaceType || null,
            employment_type: p.employmentType || null,
            started_at: p.startedAt || null,
            ended_at: p.endedAt || null,
            description: p.description || null,
          })),
        )
        .execute();
    }

    if (resume.education?.length > 0) {
      await trx
        .insertInto("member_education")
        .values(
          resume.education.map((e) => ({
            did,
            institution: e.institution,
            degree: e.degree,
            field: e.field || null,
            started_at: e.startedAt || null,
            ended_at: e.endedAt || null,
            description: e.description || null,
          })),
        )
        .execute();
    }

    if (resume.projects?.length > 0) {
      await trx
        .insertInto("member_projects")
        .values(
          resume.projects.map((p) => ({
            did,
            name: p.name,
            description: p.description || null,
            url: p.url || null,
            started_at: p.startedAt || null,
            ended_at: p.endedAt || null,
          })),
        )
        .execute();
    }

    if (resume.skills?.length > 0) {
      await trx
        .insertInto("member_skills")
        .values(
          resume.skills.map((skill) => ({
            did,
            skill,
          })),
        )
        .execute();
    }

    if (resume.languages?.length > 0) {
      await trx
        .insertInto("member_languages")
        .values(
          resume.languages.map((language) => ({
            did,
            language,
          })),
        )
        .execute();
    }

    if (resume.preferredWorkplace?.length > 0) {
      await trx
        .insertInto("member_preferred_workplaces")
        .values(
          resume.preferredWorkplace.map((workplace_type) => ({
            did,
            workplace_type,
          })),
        )
        .execute();
    }
  });

  return json({ success: true });
};
