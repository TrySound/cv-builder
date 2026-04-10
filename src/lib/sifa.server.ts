import { Client } from "@atproto/lex";
import { extractPdsUrl } from "@atproto/oauth-client-node";
import * as sifa from "$lib/lexicons/id/sifa";
import * as bsky from "$lib/lexicons/app/bsky";
import { handleResolver, didResolver } from "./auth";
import type {
  Resume,
  Work,
  Education,
  WorkplaceType,
  EmploymentType,
} from "./jsonresume";

// Map sifa employment type to jsonresume employment type
function getEmploymentType(
  type: sifa.profile.position.Main["employmentType"] | undefined,
): EmploymentType | undefined {
  if (type === "id.sifa.defs#fullTime") {
    return "fulltime";
  }
  if (type === "id.sifa.defs#partTime") {
    return "parttime";
  }
  if (type === "id.sifa.defs#contract") {
    return "contract";
  }
  if (type === "id.sifa.defs#freelance") {
    return "freelance";
  }
  if (type === "id.sifa.defs#internship") {
    return "internship";
  }
}

// Map sifa workplace type to jsonresume workplace type
function getWorkplaceType(
  type: sifa.profile.position.Main["workplaceType"],
): WorkplaceType | undefined {
  if (type === "id.sifa.defs#onSite") {
    return "onsite";
  }
  if (type === "id.sifa.defs#remote") {
    return "remote";
  }
  if (type === "id.sifa.defs#hybrid") {
    return "hybrid";
  }
}

// Infer network from URL (fallback for platformOther)
function inferNetwork(url: string): string | undefined {
  url = url.toLowerCase();
  if (url.includes("github.com")) {
    return "GitHub";
  }
  if (url.includes("linkedin.com")) {
    return "LinkedIn";
  }
  if (url.includes("twitter.com") || url.includes("x.com")) {
    return "Twitter";
  }
  if (url.includes("facebook.com")) {
    return "Facebook";
  }
  if (url.includes("instagram.com")) {
    return "Instagram";
  }
  if (url.includes("t.me") || url.includes("telegram.me")) {
    return "Telegram";
  }
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    return "YouTube";
  }
  if (url.includes("mastodon")) {
    return "Mastodon";
  }
  return undefined;
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
  handle: string,
): Promise<Resume | undefined> {
  // Resolve handle to DID
  const did = await handleResolver.resolve(handle);
  if (!did) {
    return;
  }

  // Create type-safe client pointing to the user's PDS
  const didDoc = await didResolver.resolve(did);
  const pdsEndpoint = extractPdsUrl(didDoc);
  const client = new Client(pdsEndpoint);

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
    bskyProfileResponse,
  ] = await Promise.all([
    // Profile is a singleton record at rkey "self"
    client
      .get(sifa.profile.self.main, {
        rkey: "self",
        repo: did,
      })
      .catch((error) => console.error(error)),
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
    client
      .get(bsky.actor.profile.main, {
        rkey: "self",
        repo: did,
      })
      .catch((error) => console.error(error)),
  ]);

  // Extract data with full type safety from generated lexicons
  const bskyProfile = bskyProfileResponse?.value;
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
      network: inferNetwork(account.url),
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
      name: bskyProfile?.displayName,
      label: profile?.headline,
      summary: profile?.about,
      url: bskyProfile?.website,
      location,
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
