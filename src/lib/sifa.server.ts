import { Client, type DatetimeString, type DidString } from "@atproto/lex";
import { Agent } from "@atproto/api";
import * as sifa from "$lib/lexicons/id/sifa";
import { getOAuthClient } from "./auth";
import type {
  Resume,
  Work,
  Education,
  WorkplaceType,
  EmploymentType,
} from "./jsonresume";
import { getDB } from "./db";
import { normalizeUrl } from "./link";
import { getPdsClient, getRkey } from "./atproto";

// Map sifa employment type to jsonresume employment type
function getEmploymentType(
  type: sifa.profile.position.Main["employmentType"] | undefined,
): EmploymentType | undefined {
  switch (type) {
    case "id.sifa.defs#fullTime":
      return "fulltime";
    case "id.sifa.defs#partTime":
      return "parttime";
    case "id.sifa.defs#contract":
      return "contract";
    case "id.sifa.defs#freelance":
      return "freelance";
    case "id.sifa.defs#internship":
      return "internship";
  }
}

// Map sifa workplace type to jsonresume workplace type
function getWorkplaceType(
  type: sifa.profile.position.Main["workplaceType"],
): WorkplaceType | undefined {
  switch (type) {
    case "id.sifa.defs#onSite":
      return "onsite";
    case "id.sifa.defs#remote":
      return "remote";
    case "id.sifa.defs#hybrid":
      return "hybrid";
  }
}

// Format datetime to ISO8601 date (YYYY-MM-DD)
function formatDate(dateString: string | undefined): string | undefined {
  if (!dateString) {
    return;
  }
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return;
  }
  return date.toISOString().split("T")[0];
}

export async function loadSifaResume(
  did: DidString,
  isOwnProfile: boolean,
): Promise<Resume | undefined> {
  const db = await getDB();
  const profileIndex = await db
    .selectFrom("profile_index")
    .select(["name", "title", "country_code"])
    .where("did", "=", did)
    .executeTakeFirst();
  let profilePrivate;
  if (isOwnProfile) {
    profilePrivate = await db
      .selectFrom("profile_private")
      .select(["email"])
      .where("did", "=", did)
      .executeTakeFirst();
  }

  // Create type-safe client pointing to the user's PDS
  const client = await getPdsClient(did);

  // catch validation errors in records
  const getRecords = <T>(response: { records: T; invalid: unknown }) => {
    if (response.records) {
      return response.records;
    }
    if (response.invalid) {
      console.error(response);
    }
  };

  // Fetch all sifa records using typed lexicon schemas
  const [
    profileResponse,
    positionsRecords,
    educationRecords,
    skillsRecords,
    projectsRecords,
    languagesRecords,
    externalAccountsRecords,
  ] = await Promise.all([
    // Profile is a singleton record at rkey "self"
    client
      .get(sifa.profile.self.main, {
        rkey: "self",
        repo: did,
      })
      .catch(() => undefined),
    // Other records are listed
    client
      .list(sifa.profile.position.main, {
        repo: did,
        limit: 100,
      })
      .then(getRecords)
      .catch((error) => console.error(error)),
    client
      .list(sifa.profile.education.main, {
        repo: did,
        limit: 100,
      })
      .then(getRecords)
      .catch((error) => console.error(error)),
    client
      .list(sifa.profile.skill.main, {
        repo: did,
        limit: 100,
      })
      .then(getRecords)
      .catch((error) => console.error(error)),
    client
      .list(sifa.profile.project.main, {
        repo: did,
        limit: 100,
      })
      .then(getRecords)
      .catch((error) => console.error(error)),
    client
      .list(sifa.profile.language.main, {
        repo: did,
        limit: 100,
      })
      .then(getRecords)
      .catch((error) => console.error(error)),
    client
      .list(sifa.profile.externalAccount.main, {
        repo: did,
        limit: 100,
      })
      .then(getRecords)
      .catch((error) => console.error(error)),
  ]);

  // Extract data with full type safety from generated lexicons
  const profile = profileResponse?.value;

  // Build profiles array from external accounts
  const externalAccounts =
    externalAccountsRecords?.map((r) =>
      sifa.profile.externalAccount.main.$cast(r.value),
    ) ?? [];
  // Sort: isPrimary first, then others
  const sortedAccounts = externalAccounts.sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) {
      return -1;
    }
    if (!a.isPrimary && b.isPrimary) {
      return 1;
    }
    return 0;
  });
  const resumeProfiles = sortedAccounts.map((account) => {
    return {
      url: account.url,
    };
  });

  const work = (positionsRecords ?? []).map((record) => {
    const item = sifa.profile.position.main.$cast(record.value);
    const workEntry: Work = {
      name: item.company,
      position: item.title,
      startDate: formatDate(item.startedAt),
      endDate: formatDate(item.endedAt),
      summary: item.description,
    };
    if (item.location) {
      const { city, region, countryCode } = item.location;
      workEntry.location = [city, region, countryCode]
        .filter(Boolean)
        .join(", ");
    }
    const employmentType = getEmploymentType(item.employmentType);
    const workplaceType = getWorkplaceType(item.workplaceType);
    if (employmentType || workplaceType) {
      workEntry.extension = {
        employmentType,
        workplaceType,
      };
    }
    return workEntry;
  });

  const education: Education[] = (educationRecords ?? []).map((record) => {
    const item = sifa.profile.education.main.$cast(record.value);
    const eduEntry: Education = {
      institution: item.institution,
      area: item.fieldOfStudy,
      studyType: item.degree,
      startDate: formatDate(item.startedAt),
      endDate: formatDate(item.endedAt),
    };
    if (item.description) {
      eduEntry.extension = { description: item.description };
    }
    return eduEntry;
  });

  const projects = (projectsRecords ?? []).map((record) => {
    const item = sifa.profile.project.main.$cast(record.value);
    return {
      name: item.name || "",
      description: item.description,
      url: item.url,
      startDate: formatDate(item.startedAt),
      endDate: formatDate(item.endedAt),
    };
  });

  const skills = (skillsRecords ?? []).map((record) => {
    const item = sifa.profile.skill.main.$cast(record.value);
    return { name: item.name };
  });

  const languages = (languagesRecords ?? []).map((record) => {
    const item = sifa.profile.language.main.$cast(record.value);
    return {
      language: item.name,
    };
  });

  let location: undefined | { address: string };
  if (profile?.location) {
    const { city, region, countryCode } = profile.location;
    location = {
      address: [city, region, countryCode].filter(Boolean).join(", "),
    };
  }

  const extension: Resume["extension"] = {};
  if (profile?.industry) {
    extension.industry = profile.industry;
  }

  const preferredWorkplaces = profile?.preferredWorkplace
    ?.map(getWorkplaceType)
    .filter((w) => w !== undefined);
  if (preferredWorkplaces && preferredWorkplaces.length > 0) {
    extension.preferredWorkplaces = preferredWorkplaces;
  }

  const resume: Resume = {
    $schema:
      "https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json",
    basics: {
      name: profileIndex?.name ?? undefined,
      label: profileIndex?.title ?? undefined,
      location: profileIndex?.country_code
        ? { countryCode: profileIndex.country_code }
        : undefined,
      email: profilePrivate?.email ?? undefined,
      summary: profile?.about,
      profiles: resumeProfiles.length > 0 ? resumeProfiles : undefined,
    },
    work: work.length > 0 ? work : undefined,
    education: education.length > 0 ? education : undefined,
    projects: projects.length > 0 ? projects : undefined,
    skills: skills.length > 0 ? skills : undefined,
    languages: languages.length > 0 ? languages : undefined,
    extension: Object.keys(extension).length > 0 ? extension : undefined,
  };

  return resume;
}

// Reverse mapping: jsonresume employment type to sifa employment type
function getSifaEmploymentType(
  type: EmploymentType | undefined,
): sifa.profile.position.Main["employmentType"] | undefined {
  switch (type) {
    case "fulltime":
      return "id.sifa.defs#fullTime";
    case "parttime":
      return "id.sifa.defs#partTime";
    case "contract":
      return "id.sifa.defs#contract";
    case "freelance":
      return "id.sifa.defs#freelance";
    case "internship":
      return "id.sifa.defs#internship";
  }
}

// Reverse mapping: jsonresume workplace type to sifa workplace type
function getSifaWorkplaceType(
  type: WorkplaceType | undefined,
): sifa.profile.position.Main["workplaceType"] | undefined {
  switch (type) {
    case "onsite":
      return "id.sifa.defs#onSite";
    case "remote":
      return "id.sifa.defs#remote";
    case "hybrid":
      return "id.sifa.defs#hybrid";
  }
}

// Parse location string into sifa location format
function parseLocation(
  address: string | undefined,
): sifa.profile.self.Main["location"] | undefined {
  if (!address) {
    return;
  }
  const parts = address.split(",").map((p) => p.trim());
  // Try to guess: city, region, countryCode
  if (parts.length >= 3) {
    return {
      city: parts[0],
      region: parts[1],
      countryCode: parts[2].toUpperCase(),
    };
  }
}

const updateWork = async (client: Client, resume: Resume) => {
  const now = new Date().toISOString() as DatetimeString;
  const existingPositions = await client.list(sifa.profile.position.main);
  for (const record of existingPositions.records) {
    await client.delete(sifa.profile.position, {
      rkey: getRkey(record.uri),
    });
  }
  for (const work of resume.work ?? []) {
    await client.create(sifa.profile.position.main, {
      createdAt: now,
      company: work.name ?? "",
      title: work.position ?? "",
      startedAt: work.startDate ?? now,
      endedAt: work.endDate,
      description: work.summary,
      location: work.location ? parseLocation(work.location) : undefined,
      employmentType: getSifaEmploymentType(work.extension?.employmentType),
      workplaceType: getSifaWorkplaceType(work.extension?.workplaceType),
    });
  }
};

const updateEducation = async (client: Client, resume: Resume) => {
  const now = new Date().toISOString() as DatetimeString;
  const existingEducation = await client.list(sifa.profile.education.main);
  for (const record of existingEducation.records) {
    await client.delete(sifa.profile.education, {
      rkey: getRkey(record.uri),
    });
  }
  for (const edu of resume.education ?? []) {
    await client.create(sifa.profile.education.main, {
      createdAt: now,
      institution: edu.institution ?? "",
      degree: edu.studyType ?? "",
      fieldOfStudy: edu.area,
      startedAt: edu.startDate ?? now,
      endedAt: edu.endDate,
      description: edu.extension?.description,
    });
  }
};

const updateProjects = async (client: Client, resume: Resume) => {
  const now = new Date().toISOString() as DatetimeString;
  const existingProjects = await client.list(sifa.profile.project.main);
  for (const record of existingProjects.records) {
    await client.delete(sifa.profile.project, {
      rkey: getRkey(record.uri),
    });
  }
  for (const project of resume.projects ?? []) {
    await client.create(sifa.profile.project.main, {
      createdAt: now,
      name: project.name ?? "",
      description: project.description,
      url: project.url
        ? (normalizeUrl(project.url) as `${string}:${string}`)
        : undefined,
      startedAt: project.startDate ?? now,
      endedAt: project.endDate,
    });
  }
};

const updateSkills = async (client: Client, resume: Resume) => {
  const now = new Date().toISOString() as DatetimeString;
  const existingSkills = await client.list(sifa.profile.skill);
  for (const record of existingSkills.records) {
    await client.delete(sifa.profile.skill, {
      rkey: getRkey(record.uri),
    });
  }
  for (const skill of resume.skills ?? []) {
    await client.create(sifa.profile.skill, {
      createdAt: now,
      name: skill.name ?? "",
    });
  }
};

const updateLanguages = async (client: Client, resume: Resume) => {
  const now = new Date().toISOString() as DatetimeString;
  const existingLanguages = await client.list(sifa.profile.language.main);
  for (const record of existingLanguages.records) {
    await client.delete(sifa.profile.language, {
      rkey: getRkey(record.uri),
    });
  }
  for (const language of resume.languages ?? []) {
    await client.create(sifa.profile.language.main, {
      createdAt: now,
      name: language.language ?? "",
    });
  }
};

export async function updateSifaResume(
  did: string,
  resume: Resume,
): Promise<void> {
  // Create typed client with authenticated session
  const oauthClient = await getOAuthClient();
  const session = await oauthClient.restore(did);
  const client = new Client(new Agent(session));

  // update records concurrently to speed up update
  // Note: basics (name, email, summary, profiles) are handled by updateResumeBasics
  await Promise.all([
    updateWork(client, resume),
    updateEducation(client, resume),
    updateProjects(client, resume),
    updateSkills(client, resume),
    updateLanguages(client, resume),
  ]);
}
