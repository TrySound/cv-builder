<script lang="ts">
  import type { Resume } from "$lib/jsonresume";
  import { SKILLS_TAXONOMY } from "$lib/cv-parser";
  import MultiSelectCombobox from "./multi-select-combobox.svelte";
  import DatePicker from "$lib/date-picker.svelte";

  let {
    resume,
    onSave,
    readonly = false,
    fullResume = false,
  }: {
    resume: Resume;
    onSave?: (resume: Resume) => void;
    readonly?: boolean;
    fullResume?: boolean;
  } = $props();

  // Local state for editing - only populated while editing
  let editingResume = $state<Required<Resume> | null>(null);

  const displayResume = $derived(editingResume ?? resume);

  function sortByDate<T extends { startDate?: string; endDate?: string }>(
    items: T[] | undefined,
  ): T[] {
    if (!items) return [];
    return [...items].sort((a, b) => {
      // Primary: startDate descending (ISO strings compare correctly)
      if (a.startDate !== b.startDate) {
        return (b.startDate ?? "") > (a.startDate ?? "") ? 1 : -1;
      }
      // Secondary: endDate descending, null = present/current (treated as latest)
      const aEnd = a.endDate ?? "9999-12-31"; // Far future date for current items
      const bEnd = b.endDate ?? "9999-12-31";
      return bEnd > aEnd ? 1 : -1;
    });
  }

  // Sorted arrays for display
  const work = $derived(sortByDate(displayResume.work));
  const education = $derived(sortByDate(displayResume.education));
  const projects = $derived(sortByDate(displayResume.projects));

  // Track which section/card is being edited
  // Format: 'contact', 'summary', 'experience-0', 'education-2', 'skills'
  let editingId = $state<string | null>(null);

  // Define options for comboboxes
  const workplaceOptions = ["onsite", "remote", "hybrid"];
  const languageOptions = [
    "English",
    "Spanish",
    "French",
    "German",
    "Italian",
    "Portuguese",
    "Russian",
    "Chinese",
    "Japanese",
    "Korean",
    "Arabic",
    "Hindi",
    "Dutch",
    "Swedish",
    "Polish",
    "Turkish",
    "Vietnamese",
    "Thai",
    "Indonesian",
    "Hebrew",
  ];

  // Create flat list of all skills from taxonomy
  const allSkills = [...new Set(Object.values(SKILLS_TAXONOMY).flat())].sort(
    (a, b) => a.toLowerCase().localeCompare(b.toLowerCase()),
  );

  // Group skills by category for display
  const skillsByCategory = $derived(() => {
    const grouped: Record<string, string[]> = {};
    const profileSkills = displayResume.skills?.map((s) => s.name ?? "") ?? [];
    for (const [category, skills] of Object.entries(SKILLS_TAXONOMY)) {
      const matched = skills.filter((skill) =>
        profileSkills.some((s) => s.toLowerCase() === skill.toLowerCase()),
      );
      if (matched.length > 0) {
        grouped[category] = matched;
      }
    }
    // Add "Other" category for custom skills not in taxonomy
    const taxonomySkills = new Set(Object.values(SKILLS_TAXONOMY).flat());
    const otherSkills = profileSkills.filter(
      (skill) => !taxonomySkills.has(skill.toLowerCase()),
    );
    if (otherSkills.length > 0) {
      grouped["Other"] = otherSkills;
    }
    return grouped;
  });

  function isEditing(section: string, index?: number): boolean {
    const targetId = index !== undefined ? `${section}-${index}` : section;
    return editingId === targetId;
  }

  // format with required fields to simplify editing
  // backward compatible with json resume
  const getEditableResume = (resume: Resume): Required<Resume> => {
    resume = structuredClone(resume);
    return {
      $schema: resume.$schema ?? "",
      basics: resume.basics ?? {},
      work: resume.work ?? [],
      volunteer: resume.volunteer ?? [],
      education: resume.education ?? [],
      awards: resume.awards ?? [],
      certificates: resume.certificates ?? [],
      publications: resume.publications ?? [],
      skills: resume.skills ?? [],
      languages: resume.languages ?? [],
      interests: resume.interests ?? [],
      references: resume.references ?? [],
      projects: resume.projects ?? [],
      meta: resume.meta ?? {},
      extension: resume.extension ?? {},
    };
  };

  function startEditing(section: string, index?: number) {
    if (readonly) return;
    // Create editing copy when starting to edit
    // use snapshot to prevent structuredClone failing on proxy
    editingResume ??= getEditableResume($state.snapshot(resume));
    const targetId = index !== undefined ? `${section}-${index}` : section;
    editingId = targetId;
  }

  function stopEditing() {
    if (editingResume) {
      // Clean up empty strings to undefined for optional enum fields
      for (const workItem of editingResume.work ?? []) {
        if ((workItem as any).extension?.workplaceType === "") {
          workItem.extension = {
            ...workItem.extension,
            workplaceType: undefined,
          };
        }
        if ((workItem as any).extension?.employmentType === "") {
          workItem.extension = {
            ...workItem.extension,
            employmentType: undefined,
          };
        }
      }
      onSave?.(editingResume);
    }
    editingId = null;
    editingResume = null;
  }

  function addExperience() {
    if (readonly) return;
    editingResume ??= getEditableResume($state.snapshot(resume));
    editingResume.work.unshift({});
    // Start editing the new entry (index 0 after unshift)
    editingId = "experience-0";
  }

  function removeExperience(index: number) {
    if (readonly) return;
    editingResume ??= getEditableResume($state.snapshot(resume));
    editingResume.work.splice(index, 1);
    // If we were editing this card, stop editing
    stopEditing();
  }

  function addEducation() {
    if (readonly) return;
    editingResume ??= getEditableResume($state.snapshot(resume));
    editingResume.education.unshift({});
    editingId = "education-0";
  }

  function removeEducation(index: number) {
    if (readonly) return;
    editingResume ??= getEditableResume($state.snapshot(resume));
    editingResume.education.splice(index, 1);
    stopEditing();
  }

  function addProject() {
    if (readonly) return;
    editingResume ??= getEditableResume($state.snapshot(resume));
    editingResume.projects.unshift({});
    editingId = "projects-0";
  }

  function removeProject(index: number) {
    if (readonly) return;
    editingResume ??= getEditableResume($state.snapshot(resume));
    editingResume.projects.splice(index, 1);
    stopEditing();
  }

  function getNetworkDisplayName(url: string): string {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes("github.com")) return "GitHub";
    if (lowerUrl.includes("linkedin.com")) return "LinkedIn";
    if (lowerUrl.includes("twitter.com") || lowerUrl.includes("x.com"))
      return "Twitter";
    if (lowerUrl.includes("facebook.com")) return "Facebook";
    if (lowerUrl.includes("instagram.com")) return "Instagram";
    if (lowerUrl.includes("t.me") || lowerUrl.includes("telegram.me"))
      return "Telegram";

    try {
      const hostname = new URL(url.startsWith("http") ? url : `https://${url}`)
        .hostname;
      return hostname.replace(/^www\./, "");
    } catch {
      return url;
    }
  }

  function getNetworkIcon(url: string): string {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes("github.com")) return "github";
    if (lowerUrl.includes("linkedin.com")) return "linkedin";
    return "website";
  }
</script>

<!-- Contacts and summary -->
<section class="cv-section" aria-label="Contacts and summary">
  {#if isEditing("contact") && editingResume}
    <!-- Editor -->

    <div class="row">
      <div><!-- skip column --></div>
      <div class="cv-row-heading">
        <h2 class="heading-2">Contacts and Summary</h2>
        <button
          class="icon-button"
          aria-label="Save contacts and summary"
          onclick={() => stopEditing()}
        >
          <svg width="20" height="20">
            <use href="#icon-check" />
          </svg>
        </button>
      </div>
      <div><!-- skip column --></div>

      <div class="form-stack">
        <div class="form-grid">
          <div class="form-group">
            <label for="contact-name" class="form-label">Name</label>
            <input
              type="text"
              id="contact-name"
              bind:value={editingResume.basics.name}
              placeholder="John Doe"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label for="contact-website" class="form-label">Website</label>
            <input
              type="text"
              id="contact-website"
              bind:value={editingResume.basics.url}
              placeholder="https://johndoe.com"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label for="contact-location" class="form-label">Location</label>
            <input
              type="text"
              id="contact-location"
              placeholder="San Francisco, CA"
              class="form-input"
              bind:value={
                () => editingResume?.basics.location?.address ?? "",
                (newValue) => {
                  if (editingResume) {
                    editingResume.basics.location = newValue
                      ? { address: newValue }
                      : undefined;
                  }
                }
              }
            />
          </div>
          <div class="form-group">
            <label for="contact-email" class="form-label">Email</label>
            <input
              type="email"
              id="contact-email"
              bind:value={editingResume.basics.email}
              placeholder="john@example.com"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label for="contact-headline" class="form-label">Headline</label>
            <input
              type="text"
              id="contact-headline"
              bind:value={editingResume.basics.label}
              placeholder="Senior Software Engineer at TechCorp"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label for="contact-industry" class="form-label">Industry</label>
            <input
              type="text"
              id="contact-industry"
              bind:value={editingResume.extension.industry}
              placeholder="Software Development"
              class="form-input"
            />
          </div>
          <div class="form-group full-row">
            <!-- svelte-ignore a11y_label_has_associated_control -->
            <label class="form-label">Profile URLs</label>
            {#each editingResume.basics.profiles ?? [] as profile, index}
              <div class="input-with-action">
                <input
                  bind:value={profile.url}
                  placeholder="https://linkedin.com/in/johndoe"
                  class="form-input"
                />
                <button
                  class="icon-button"
                  aria-label="Remove profile URL"
                  onclick={() => {
                    if (editingResume) {
                      const profiles = editingResume.basics.profiles ?? [];
                      profiles.splice(index, 1);
                    }
                  }}
                >
                  <svg width="16" height="16">
                    <use href="#icon-minus-circle" />
                  </svg>
                </button>
              </div>
            {/each}
            <div class="input-with-action">
              <div><!-- skip column --></div>
              <button
                class="icon-button"
                aria-label="Add profile URL"
                onclick={() => {
                  if (editingResume) {
                    const profiles = editingResume.basics.profiles ?? [];
                    profiles.push({ url: "" });
                    editingResume.basics.profiles = profiles;
                  }
                }}
              >
                <svg width="16" height="16">
                  <use href="#icon-plus" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        <div class="form-group">
          <label for="contact-summary" class="form-label">Bio / Summary</label>
          <textarea
            id="contact-summary"
            bind:value={editingResume.basics.summary}
            rows="4"
            placeholder="Brief professional summary..."
            class="form-input"
          ></textarea>
        </div>
      </div>
    </div>
  {:else}
    <!-- Preview -->

    <div class="row">
      <div><!-- skip column --></div>
      <div class="cv-row-heading">
        <div>
          <h2 class="heading-1 subtle">
            {displayResume.basics?.name || "Your Name"}
          </h2>
        </div>
        {#if !readonly}
          <button
            class="icon-button"
            aria-label="Edit contacts and summary"
            onclick={() => startEditing("contact")}
          >
            <svg width="16" height="16">
              <use href="#icon-pencil" />
            </svg>
          </button>
        {/if}
      </div>
    </div>
    <div class="row">
      <div class="cv-row-side subtle">
        {#if displayResume.basics?.location?.address}
          <div>
            {displayResume.basics.location.address}
            <svg width="14" height="14"><use href="#icon-location" /></svg>
          </div>
        {/if}
        {#if displayResume.basics?.email}
          <a href="mailto:{displayResume.basics.email}" class="link">
            Email
            <svg width="14" height="14"><use href="#icon-email" /></svg>
          </a>
        {/if}
        {#if displayResume.basics?.profiles}
          {#each displayResume.basics.profiles as profile}
            <a href={profile.url} target="_blank" class="link">
              {getNetworkDisplayName(profile.url)}
              <svg width="14" height="14">
                <use href="#icon-{getNetworkIcon(profile.url)}" />
              </svg>
            </a>
          {/each}
        {/if}
        {#if displayResume.basics?.url}
          <a href={displayResume.basics.url} target="_blank" class="link">
            {getNetworkDisplayName(displayResume.basics.url)}
            <svg width="14" height="14"><use href="#icon-website" /></svg>
          </a>
        {/if}
      </div>
      <div class="cv-row-main">
        {#if displayResume.basics?.label}
          <p class="subtle">{displayResume.basics.label}</p>
        {/if}
        {#if displayResume.basics?.summary}
          <p>{displayResume.basics.summary}</p>
        {:else}
          <p class="subtle">
            Add a professional summary to describe your background and
            expertise.
          </p>
        {/if}
      </div>
    </div>
  {/if}
</section>

<details class="experience-container" open={fullResume}>
  <!-- Work Experience -->
  <section class="cv-section" hidden={readonly && work.length === 0}>
    <div class="row">
      <div><!-- skip column --></div>
      <heading class="cv-row-heading">
        <h2 class="heading-2 subtle">Work Experience</h2>
        {#if !readonly}
          <button
            class="icon-button"
            onclick={addExperience}
            aria-label="Add Experience"
          >
            <svg width="20" height="20">
              <use href="#icon-plus" />
            </svg>
          </button>
        {/if}
      </heading>
    </div>

    {#each work as job, index}
      {#if isEditing("experience", index) && editingResume}
        <!-- Editor -->

        <div class="row">
          <div><!-- skip column --></div>
          <div class="cv-row-heading">
            <h3 class="heading-3 subtle">Edit Experience</h3>
            <button
              class="icon-button"
              aria-label="Save"
              onclick={() => stopEditing()}
            >
              <svg width="20" height="20">
                <use href="#icon-check" />
              </svg>
            </button>
          </div>
          <div><!-- skip column --></div>

          <div class="form-stack">
            <div class="form-grid">
              <div class="form-group">
                <label for="job-start-{index}" class="form-label">
                  Start Date
                </label>
                <DatePicker
                  id="job-start-{index}"
                  bind:value={editingResume.work[index].startDate}
                  placeholder="YYYY or YYYY-MM"
                />
              </div>
              <div class="form-group">
                <label for="job-end-{index}" class="form-label">End Date</label>
                <DatePicker
                  id="job-end-{index}"
                  bind:value={editingResume.work[index].endDate}
                  placeholder="YYYY or YYYY-MM"
                />
              </div>
              <div class="form-group">
                <label for="job-title-{index}" class="form-label">
                  Job Title
                </label>
                <input
                  type="text"
                  id="job-title-{index}"
                  bind:value={editingResume.work[index].position}
                  placeholder="Software Engineer"
                  class="form-input"
                />
              </div>
              <div class="form-group">
                <label for="company-{index}" class="form-label">Company</label>
                <input
                  type="text"
                  id="company-{index}"
                  bind:value={editingResume.work[index].name}
                  placeholder="TechCorp Inc."
                  class="form-input"
                />
              </div>
              <div class="form-group">
                <label for="job-location-{index}" class="form-label">
                  Location
                </label>
                <input
                  type="text"
                  id="job-location-{index}"
                  bind:value={editingResume.work[index].location}
                  placeholder="San Francisco, CA (or Remote)"
                  class="form-input"
                />
              </div>
              <div class="form-group">
                <label for="job-workplace-type-{index}" class="form-label">
                  Workplace Type
                </label>
                <select
                  id="job-workplace-type-{index}"
                  class="form-input"
                  bind:value={
                    () =>
                      editingResume?.work[index].extension?.workplaceType ?? "",
                    (newValue) => {
                      if (editingResume) {
                        editingResume.work[index].extension ??= {};
                        editingResume.work[index].extension.workplaceType =
                          newValue || undefined;
                      }
                    }
                  }
                >
                  <option value="">Select...</option>
                  <option value="onsite">On-site</option>
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
              <div class="form-group">
                <label for="job-employment-type-{index}" class="form-label">
                  Employment Type
                </label>
                <select
                  id="job-employment-type-{index}"
                  class="form-input"
                  bind:value={
                    () =>
                      editingResume?.work[index].extension?.employmentType ??
                      "",
                    (newValue) => {
                      if (editingResume) {
                        editingResume.work[index].extension ??= {};
                        editingResume.work[index].extension.employmentType =
                          newValue || undefined;
                      }
                    }
                  }
                >
                  <option value="">Select...</option>
                  <option value="fulltime">Full-time</option>
                  <option value="parttime">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="freelance">Freelance</option>
                  <option value="internship">Internship</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label for="job-desc-{index}" class="form-label"
                >Description</label
              >
              <textarea
                id="job-desc-{index}"
                bind:value={editingResume.work[index].summary}
                rows="6"
                placeholder="Describe your role, responsibilities, and achievements..."
                class="form-input"
              ></textarea>
            </div>
          </div>
        </div>
      {:else}
        <!-- Preview -->

        <div class="row">
          <div class="cv-row-side subtle">
            {#if job.startDate || job.endDate}
              <div>
                {job.startDate || ""} — {job.endDate || "Present"}
              </div>
            {/if}
            {#if job.location}
              <div>{job.location}</div>
            {/if}
            {#if job.extension?.employmentType}
              <div>{job.extension.employmentType}</div>
            {/if}
            {#if job.extension?.workplaceType}
              <div>{job.extension.workplaceType}</div>
            {/if}
          </div>
          <div class="cv-row-heading">
            <div>
              <h4 class="heading-3">{job.position || "Untitled Position"}</h4>
              {#if job.name}
                <p class="subtle">at {job.name}</p>
              {/if}
            </div>
            <div class="actions">
              {#if !readonly}
                <button
                  class="icon-button"
                  aria-label="Edit experience"
                  onclick={() => startEditing("experience", index)}
                >
                  <svg width="20" height="20">
                    <use href="#icon-pencil" />
                  </svg>
                </button>
                <button
                  class="icon-button"
                  aria-label="Delete experience"
                  onclick={() => removeExperience(index)}
                >
                  <svg width="20" height="20">
                    <use href="#icon-minus-circle" />
                  </svg>
                </button>
              {/if}
            </div>
          </div>
          <div><!-- skip column --></div>
          <div class="cv-row-main">
            {#if job.summary}
              <p>{job.summary}</p>
            {/if}
          </div>
        </div>
      {/if}
    {/each}
  </section>

  <!-- Education -->
  <section class="cv-section" hidden={readonly && education.length === 0}>
    <div class="row">
      <div><!-- skip column --></div>
      <heading class="cv-row-heading">
        <h2 class="heading-2 subtle">Education</h2>
        {#if !readonly}
          <button
            class="icon-button"
            aria-label="Add Education"
            onclick={addEducation}
          >
            <svg width="20" height="20">
              <use href="#icon-plus" />
            </svg>
          </button>
        {/if}
      </heading>
    </div>

    {#each education as edu, index}
      {#if isEditing("education", index) && editingResume}
        <!-- Editor -->

        <div class="row">
          <div><!-- skip column --></div>
          <heading class="cv-row-heading">
            <h3 class="heading-3 subtle">Edit Education</h3>
            <button
              class="icon-button"
              aria-label="Save"
              onclick={() => stopEditing()}
            >
              <svg width="20" height="20">
                <use href="#icon-check" />
              </svg>
            </button>
          </heading>
          <div><!-- skip column --></div>

          <div class="form-stack">
            <div class="form-grid">
              <div class="form-group">
                <label for="edu-start-{index}" class="form-label">
                  Start Date
                </label>
                <DatePicker
                  id="edu-start-{index}"
                  bind:value={editingResume.education[index].startDate}
                  placeholder="YYYY or YYYY-MM"
                />
              </div>
              <div class="form-group">
                <label for="edu-end-{index}" class="form-label">End Date</label>
                <DatePicker
                  id="edu-end-{index}"
                  bind:value={editingResume.education[index].endDate}
                  placeholder="YYYY or YYYY-MM"
                />
              </div>
              <div class="form-group">
                <label for="edu-institution-{index}" class="form-label">
                  Institution
                </label>
                <input
                  type="text"
                  id="edu-institution-{index}"
                  bind:value={editingResume.education[index].institution}
                  placeholder="University of Example"
                  class="form-input"
                />
              </div>
              <div class="form-group">
                <label for="edu-degree-{index}" class="form-label">Degree</label
                >
                <input
                  type="text"
                  id="edu-degree-{index}"
                  bind:value={editingResume.education[index].studyType}
                  placeholder="Bachelor of Science"
                  class="form-input"
                />
              </div>
              <div class="form-group">
                <label for="edu-field-{index}" class="form-label">
                  Field of Study
                </label>
                <input
                  type="text"
                  id="edu-field-{index}"
                  bind:value={editingResume.education[index].area}
                  placeholder="Computer Science"
                  class="form-input"
                />
              </div>
            </div>
            <div class="form-group">
              <label for="edu-desc-{index}" class="form-label"
                >Description</label
              >
              <textarea
                id="edu-desc-{index}"
                rows="4"
                placeholder="Honors, awards, achievements, relevant coursework..."
                class="form-input"
                bind:value={
                  () =>
                    editingResume?.education[index].extension?.description ??
                    "",
                  (newValue) => {
                    if (editingResume) {
                      editingResume.education[index].extension ??= {};
                      editingResume.education[index].extension.description =
                        newValue;
                    }
                  }
                }
              ></textarea>
            </div>
          </div>
        </div>
      {:else}
        <!-- Preview -->

        <div class="row">
          <div class="cv-row-side subtle">
            {#if edu.startDate || edu.endDate}
              <div>
                {edu.startDate || ""} — {edu.endDate || "Present"}
              </div>
            {/if}
            {#if edu.area}
              <div>{edu.area}</div>
            {/if}
          </div>
          <div class="cv-row-heading">
            <div>
              {#if edu.institution}
                <h4 class="heading-3">{edu.institution}</h4>
              {/if}
              {#if edu.studyType}
                <p class="subtle">at {edu.studyType}</p>
              {/if}
            </div>
            <div class="actions">
              {#if !readonly}
                <button
                  class="icon-button"
                  aria-label="Edit education"
                  onclick={() => startEditing("education", index)}
                >
                  <svg width="20" height="20">
                    <use href="#icon-pencil" />
                  </svg>
                </button>
                <button
                  class="icon-button"
                  aria-label="Delete education"
                  onclick={() => removeEducation(index)}
                >
                  <svg width="20" height="20">
                    <use href="#icon-minus-circle" />
                  </svg>
                </button>
              {/if}
            </div>
          </div>
          <div><!-- skip column --></div>
          <div class="cv-row-main">
            {#if edu.extension?.description}
              <p>{edu.extension.description}</p>
            {/if}
          </div>
        </div>
      {/if}
    {/each}
  </section>

  <!-- Projects -->
  <section class="cv-section" hidden={readonly && projects.length === 0}>
    <div class="row">
      <div><!-- skip column --></div>
      <header class="cv-row-heading">
        <h2 class="heading-2 subtle">Projects</h2>
        {#if !readonly}
          <button
            class="icon-button"
            aria-label="Add Project"
            onclick={addProject}
          >
            <svg width="20" height="20">
              <use href="#icon-plus" />
            </svg>
          </button>
        {/if}
      </header>
    </div>

    {#each projects as project, index}
      {#if isEditing("projects", index) && editingResume}
        <!-- Editor -->

        <div class="row">
          <div><!-- skip column --></div>
          <div class="cv-row-heading">
            <h3 class="heading-3">Edit Project</h3>
            <button
              class="icon-button"
              aria-label="Save"
              onclick={() => stopEditing()}
            >
              <svg width="20" height="20">
                <use href="#icon-check" />
              </svg>
            </button>
          </div>
          <div><!-- skip column --></div>

          <div class="form-stack">
            <div class="form-grid">
              <div class="form-group">
                <label for="project-start-{index}" class="form-label">
                  Start Date
                </label>
                <DatePicker
                  id="project-start-{index}"
                  bind:value={editingResume.projects[index].startDate}
                  placeholder="YYYY or YYYY-MM"
                />
              </div>
              <div class="form-group">
                <label for="project-end-{index}" class="form-label">
                  End Date
                </label>
                <DatePicker
                  id="project-end-{index}"
                  bind:value={editingResume.projects[index].endDate}
                  placeholder="YYYY or YYYY-MM"
                />
              </div>
              <div class="form-group">
                <label for="project-name-{index}" class="form-label">
                  Project Name
                </label>
                <input
                  type="text"
                  id="project-name-{index}"
                  bind:value={editingResume.projects[index].name}
                  placeholder="E-commerce Platform"
                  class="form-input"
                />
              </div>
              <div class="form-group">
                <label for="project-url-{index}" class="form-label">
                  Project URL
                </label>
                <input
                  type="url"
                  id="project-url-{index}"
                  bind:value={editingResume.projects[index].url}
                  placeholder="https://github.com/username/project"
                  class="form-input"
                />
              </div>
            </div>
            <div class="form-group">
              <label for="project-desc-{index}" class="form-label">
                Description
              </label>
              <textarea
                id="project-desc-{index}"
                bind:value={editingResume.projects[index].description}
                rows="3"
                placeholder="Brief description of the project..."
                class="form-input"
              ></textarea>
            </div>
          </div>
        </div>
      {:else}
        <!-- Preview -->

        <div class="row">
          <div class="cv-row-side subtle">
            {#if project.startDate || project.endDate}
              <div>
                {project.startDate || ""} — {project.endDate || "Present"}
              </div>
            {/if}
          </div>
          <div class="cv-row-heading">
            {#if project.url}
              <a href={project.url} target="_blank" class="heading-3 link">
                {project.name || "Untitled Project"}
              </a>
            {:else}
              <h4 class="heading-3">{project.name || "Untitled Project"}</h4>
            {/if}
            <div class="actions">
              {#if !readonly}
                <button
                  class="icon-button"
                  aria-label="Edit project"
                  onclick={() => startEditing("projects", index)}
                >
                  <svg width="20" height="20">
                    <use href="#icon-pencil" />
                  </svg>
                </button>
                <button
                  class="icon-button"
                  aria-label="Delete project"
                  onclick={() => removeProject(index)}
                >
                  <svg width="20" height="20">
                    <use href="#icon-minus-circle" />
                  </svg>
                </button>
              {/if}
            </div>
          </div>
          <div><!-- skip column --></div>
          <div class="cv-row-main">
            {#if project.description}
              <p>{project.description}</p>
            {/if}
          </div>
        </div>
      {/if}
    {/each}
  </section>

  <!-- Skills -->
  <section class="cv-section">
    <div class="row">
      <div><!-- skip column --></div>
      <header class="cv-row-heading">
        <h2 class="heading-2 subtle">Technical Skills</h2>
        {#if !readonly}
          {#if isEditing("skills")}
            <button
              class="icon-button"
              aria-label="Save skills"
              onclick={() => stopEditing()}
            >
              <svg width="20" height="20">
                <use href="#icon-check" />
              </svg>
            </button>
          {:else}
            <button
              class="icon-button"
              aria-label="Edit skills"
              onclick={() => startEditing("skills")}
            >
              <svg width="20" height="20">
                <use href="#icon-pencil" />
              </svg>
            </button>
          {/if}
        {/if}
      </header>
    </div>

    {#if isEditing("skills") && editingResume}
      <div class="row">
        <div><!-- skip column --></div>
        <div class="cv-row-main">
          <MultiSelectCombobox
            options={allSkills}
            placeholder="e.g., TypeScript"
            id="skills-combobox"
            bind:selected={
              () => editingResume?.skills.map((item) => item.name ?? "") ?? [],
              (newSkills) => {
                if (editingResume) {
                  editingResume.skills = newSkills.map((name) => ({ name }));
                }
              }
            }
          />
        </div>
      </div>
    {:else if (displayResume.skills?.length ?? 0) > 0}
      <div>
        {#each Object.entries(skillsByCategory()) as [category, skills]}
          <div class="row">
            <div class="cv-row-side subtle">{category}</div>
            <div class="cv-row-main">{skills.join(", ")}</div>
          </div>
        {/each}
      </div>
    {:else}
      <div class="row">
        <span><!-- skip columns --></span>
        <span class="cv-row-main">
          <p class="subtle">No skills added yet. Click Edit to add skills.</p>
        </span>
      </div>
    {/if}
  </section>

  <!-- Workplace Preferences -->
  <section class="cv-section">
    <div class="row">
      <div><!-- skip column --></div>
      <header class="cv-row-heading">
        <h2 class="heading-2 subtle">Workplace Preferences</h2>
        {#if !readonly}
          {#if isEditing("workplace")}
            <button
              class="icon-button"
              aria-label="Save workplace preferences"
              onclick={() => stopEditing()}
            >
              <svg width="20" height="20">
                <use href="#icon-check" />
              </svg>
            </button>
          {:else}
            <button
              class="icon-button"
              aria-label="Edit workplace preferences"
              onclick={() => startEditing("workplace")}
            >
              <svg width="20" height="20">
                <use href="#icon-pencil" />
              </svg>
            </button>
          {/if}
        {/if}
      </header>
    </div>

    {#if isEditing("workplace") && editingResume}
      <div class="row">
        <div><!-- skip column --></div>
        <div class="cv-row-main">
          <MultiSelectCombobox
            id="workplace-combobox"
            options={workplaceOptions}
            placeholder="Select workplace preferences"
            bind:selected={
              () => editingResume?.extension?.preferredWorkplaces ?? [],
              (newWorkplaces) => {
                if (editingResume) {
                  editingResume.extension.preferredWorkplaces = newWorkplaces;
                }
              }
            }
          />
        </div>
      </div>
    {:else if (displayResume.extension?.preferredWorkplaces?.length ?? 0) > 0}
      <div class="row">
        <span><!-- skip column --></span>
        <span class="cv-row-main">
          {displayResume.extension?.preferredWorkplaces?.join(", ")}
        </span>
      </div>
    {:else}
      <div class="row">
        <span><!-- skip column --></span>
        <span class="cv-row-main">
          <p class="subtle">No workplace preferences set. Click Edit to add.</p>
        </span>
      </div>
    {/if}
  </section>

  <!-- Languages -->
  <section class="cv-section">
    <div class="row">
      <div><!-- skip column --></div>
      <header class="cv-row-heading">
        <h2 class="heading-2 subtle">Languages</h2>
        {#if !readonly}
          {#if isEditing("languages")}
            <button
              class="icon-button"
              aria-label="Save languages"
              onclick={() => stopEditing()}
            >
              <svg width="20" height="20">
                <use href="#icon-check" />
              </svg>
            </button>
          {:else}
            <button
              class="icon-button"
              aria-label="Edit languages"
              onclick={() => startEditing("languages")}
            >
              <svg width="20" height="20">
                <use href="#icon-pencil" />
              </svg>
            </button>
          {/if}
        {/if}
      </header>
    </div>

    {#if isEditing("languages") && editingResume}
      <div class="row">
        <div><!-- skip column --></div>
        <div class="cv-row-main">
          <MultiSelectCombobox
            id="languages-combobox"
            options={languageOptions}
            placeholder="Select or add languages"
            bind:selected={
              () =>
                (editingResume?.languages ?? []).map(
                  (item) => item.language ?? "",
                ),
              (newLanguages) => {
                if (editingResume) {
                  editingResume.languages = newLanguages.map((language) => ({
                    language,
                  }));
                }
              }
            }
          />
        </div>
      </div>
    {:else if (displayResume.languages?.length ?? 0) > 0}
      <div class="row">
        <span><!-- skip column --></span>
        <span class="cv-row-main">
          {displayResume.languages
            ?.map((l) => l.language)
            .filter(Boolean)
            .join(", ")}
        </span>
      </div>
    {:else}
      <div class="row">
        <span><!-- skip column --></span>
        <span class="cv-row-main">
          <p class="subtle">No languages added yet. Click Edit to add.</p>
        </span>
      </div>
    {/if}
  </section>

  <summary class="icon-button expand-more">
    <svg width="20" height="20">
      <use href="#icon-chevron-down" />
    </svg>
  </summary>
</details>

<style>
  .heading-2 {
    text-transform: uppercase;
  }

  .cv-section:not([hidden]) {
    display: grid;
    gap: var(--space-6);
    margin-bottom: var(--space-12);
  }

  .cv-row-heading {
    display: flex;
    justify-content: space-between;
    align-items: start;
    gap: var(--space-2);
    p {
      margin-top: 0;
    }
  }

  .cv-row-side {
    display: grid;
    grid-auto-rows: min-content;
    justify-items: end;
  }

  .cv-row-main {
    p {
      margin-top: 0;
      white-space: pre-line;
    }
    & > *:first-child {
      margin-top: 0;
    }
    & > *:last-child {
      margin-bottom: 0;
    }
  }

  .input-with-action {
    display: grid;
    grid-template-columns: 1fr max-content;
    gap: var(--space-2);
  }

  .full-row {
    grid-column: 1 / -1;
  }

  .experience-container {
    display: grid;
    position: relative;

    @media (prefers-reduced-motion: no-preference) {
      interpolate-size: allow-keywords;
    }

    &::details-content {
      opacity: 0;
      block-size: 0;
      overflow-y: clip;
      transition:
        content-visibility var(--transition-base) allow-discrete,
        opacity var(--transition-base),
        block-size var(--transition-base);
    }

    &[open]::details-content {
      opacity: 1;
      block-size: auto;
    }
  }

  .expand-more {
    position: absolute;
    bottom: 0;
    /* 50% - half icon button size */
    left: calc(50% - 18px);
    display: inline-flex;
    margin: auto;

    .experience-container[open] & svg {
      rotate: 180deg;
    }
  }

  @media (max-width: 640px) {
    .cv-row-side {
      justify-items: start;
    }
  }
</style>
