<script lang="ts">
  import type { Resume } from "$lib/resume-schema";
  import { SKILLS_TAXONOMY } from "$lib/cv-parser";
  import MultiSelectCombobox from "./multi-select-combobox.svelte";
  import DatePicker from "$lib/date-picker.svelte";

  let {
    resume,
    onSave,
    readonly = false,
  }: {
    resume: Resume;
    onSave?: (resume: Resume) => void;
    readonly?: boolean;
  } = $props();

  // Local state for editing - only populated while editing
  let editingResume = $state<Resume | null>(null);

  // Computed resume to display (either editing copy or original)
  const displayResume = $derived(editingResume ?? resume);

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
    const profileSkills = displayResume.skills ?? [];
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

  function startEditing(section: string, index?: number) {
    if (readonly) return;
    // Create editing copy when starting to edit
    editingResume ??= structuredClone(resume);
    const targetId = index !== undefined ? `${section}-${index}` : section;
    editingId = targetId;
  }

  function stopEditing() {
    if (editingResume) {
      // Clean up empty strings to undefined for optional enum fields
      for (const position of editingResume.positions) {
        if ((position as any).workplaceType === "") {
          position.workplaceType = undefined;
        }
        if ((position as any).employmentType === "") {
          position.employmentType = undefined;
        }
      }
      onSave?.(editingResume);
    }
    editingId = null;
    editingResume = null;
  }

  function addExperience() {
    if (readonly) return;
    editingResume ??= structuredClone(resume);
    editingResume.positions.unshift({
      title: "",
      company: "",
      location: "",
      startedAt: "",
      endedAt: "",
    });
    // Start editing the new entry (index 0 after unshift)
    editingId = "experience-0";
  }

  function removeExperience(index: number) {
    if (readonly) return;
    editingResume ??= structuredClone(resume);
    editingResume.positions.splice(index, 1);
    // If we were editing this card, stop editing
    stopEditing();
  }

  function addEducation() {
    if (readonly) return;
    editingResume ??= structuredClone(resume);
    editingResume.education.unshift({
      institution: "",
      degree: "",
      field: "",
      startedAt: "",
      endedAt: "",
    });
    editingId = "education-0";
  }

  function removeEducation(index: number) {
    if (readonly) return;
    editingResume ??= structuredClone(resume);
    editingResume.education.splice(index, 1);
    stopEditing();
  }

  function addProject() {
    if (readonly) return;
    editingResume ??= structuredClone(resume);
    editingResume.projects.unshift({
      name: "",
      description: "",
      startedAt: "",
      endedAt: "",
    });
    editingId = "projects-0";
  }

  function removeProject(index: number) {
    if (readonly) return;
    editingResume ??= structuredClone(resume);
    editingResume.projects.splice(index, 1);
    stopEditing();
  }

  const normalizeUrl = (url: string) => {
    if (url.startsWith("https://")) {
      return url;
    }
    return `https://${url}`;
  };
</script>

<!-- Contacts and summary -->
<section class="cv-section" aria-label="Contacts and summary">
  {#if isEditing("contact") && editingResume}
    <!-- Editor -->

    <div class="cv-row">
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
              bind:value={editingResume.profile.name}
              placeholder="John Doe"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label for="contact-website" class="form-label">Website</label>
            <input
              type="text"
              id="contact-website"
              bind:value={editingResume.profile.website}
              placeholder="https://johndoe.com"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label for="contact-location" class="form-label">Location</label>
            <input
              type="text"
              id="contact-location"
              bind:value={editingResume.profile.location}
              placeholder="San Francisco, CA"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label for="contact-email" class="form-label">Email</label>
            <input
              type="email"
              id="contact-email"
              bind:value={editingResume.profile.email}
              placeholder="john@example.com"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label for="contact-linkedin" class="form-label">LinkedIn</label>
            <input
              type="text"
              id="contact-linkedin"
              bind:value={editingResume.profile.linkedin}
              placeholder="linkedin.com/in/johndoe"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label for="contact-github" class="form-label">GitHub</label>
            <input
              type="text"
              id="contact-github"
              bind:value={editingResume.profile.github}
              placeholder="github.com/johndoe"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label for="contact-headline" class="form-label">Headline</label>
            <input
              type="text"
              id="contact-headline"
              bind:value={editingResume.profile.headline}
              placeholder="Senior Software Engineer at TechCorp"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label for="contact-industry" class="form-label">Industry</label>
            <input
              type="text"
              id="contact-industry"
              bind:value={editingResume.profile.industry}
              placeholder="Software Development"
              class="form-input"
            />
          </div>
        </div>
        <div class="form-group">
          <label for="contact-summary" class="form-label">Bio / Summary</label>
          <textarea
            id="contact-summary"
            bind:value={editingResume.profile.summary}
            rows="4"
            placeholder="Brief professional summary..."
            class="form-input"
          ></textarea>
        </div>
      </div>
    </div>
  {:else}
    <!-- Preview -->

    <div class="cv-row">
      <div><!-- skip column --></div>
      <div class="cv-row-heading">
        <div>
          <h2 class="heading-1 subtle">
            {displayResume.profile.name || "Your Name"}
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
    <div class="cv-row">
      <div class="cv-row-side subtle">
        {#if displayResume.profile.location}
          <div>
            {displayResume.profile.location}
            <svg width="14" height="14"><use href="#icon-location" /></svg>
          </div>
        {/if}
        {#if displayResume.profile.email}
          <a href="mailto:{displayResume.profile.email}" class="link">
            Email
            <svg width="14" height="14"><use href="#icon-email" /></svg>
          </a>
        {/if}
        {#if displayResume.profile.linkedin}
          <a
            href={normalizeUrl(displayResume.profile.linkedin)}
            target="_blank"
            class="link"
          >
            LinkedIn
            <svg width="14" height="14"><use href="#icon-linkedin" /></svg>
          </a>
        {/if}
        {#if displayResume.profile.github}
          <a
            href={normalizeUrl(displayResume.profile.github)}
            target="_blank"
            class="link"
          >
            <span>GitHub</span>
            <svg width="14" height="14"><use href="#icon-github" /></svg>
          </a>
        {/if}
        {#if displayResume.profile.website}
          <a
            href={normalizeUrl(displayResume.profile.website)}
            target="_blank"
            class="link"
          >
            Website
            <svg width="14" height="14"><use href="#icon-website" /></svg>
          </a>
        {/if}
      </div>
      <div class="cv-row-main">
        {#if displayResume.profile.summary}
          <p>{displayResume.profile.summary}</p>
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

<!-- Work Experience -->
<section class="cv-section">
  <div class="cv-row">
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

  {#each displayResume.positions as job, index}
    {#if isEditing("experience", index) && editingResume}
      <!-- Editor -->

      <div class="cv-row">
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
                bind:value={editingResume.positions[index].startedAt}
                placeholder="YYYY or YYYY-MM"
              />
            </div>
            <div class="form-group">
              <label for="job-end-{index}" class="form-label">End Date</label>
              <DatePicker
                id="job-end-{index}"
                bind:value={editingResume.positions[index].endedAt}
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
                bind:value={editingResume.positions[index].title}
                placeholder="Software Engineer"
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label for="company-{index}" class="form-label">Company</label>
              <input
                type="text"
                id="company-{index}"
                bind:value={editingResume.positions[index].company}
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
                bind:value={editingResume.positions[index].location}
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
                bind:value={editingResume.positions[index].workplaceType}
                class="form-input"
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
                bind:value={editingResume.positions[index].employmentType}
                class="form-input"
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
            <label for="job-desc-{index}" class="form-label">Description</label>
            <textarea
              id="job-desc-{index}"
              bind:value={editingResume.positions[index].description}
              rows="6"
              placeholder="Describe your role, responsibilities, and achievements..."
              class="form-input"
            ></textarea>
          </div>
        </div>
      </div>
    {:else}
      <!-- Preview -->

      <div class="cv-row">
        <div class="cv-row-side subtle">
          {#if job.startedAt || job.endedAt}
            <div>
              {job.startedAt || ""} — {job.endedAt || "Present"}
            </div>
          {/if}
          {#if job.location}
            <div>{job.location}</div>
          {/if}
          {#if job.employmentType}
            <div>{job.employmentType}</div>
          {/if}
          {#if job.workplaceType}
            <div>{job.workplaceType}</div>
          {/if}
        </div>
        <div class="cv-row-heading">
          <div>
            <h4 class="heading-3">{job.title || "Untitled Position"}</h4>
            {#if job.company}
              <p class="subtle">at {job.company}</p>
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
          {#if job.description}
            <p>{job.description}</p>
          {/if}
        </div>
      </div>
    {/if}
  {/each}
</section>

<!-- Education -->
<section class="cv-section">
  <div class="cv-row">
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

  {#each displayResume.education as edu, index}
    {#if isEditing("education", index) && editingResume}
      <!-- Editor -->

      <div class="cv-row">
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
                bind:value={editingResume.education[index].startedAt}
                placeholder="YYYY or YYYY-MM"
              />
            </div>
            <div class="form-group">
              <label for="edu-end-{index}" class="form-label">End Date</label>
              <DatePicker
                id="edu-end-{index}"
                bind:value={editingResume.education[index].endedAt}
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
              <label for="edu-degree-{index}" class="form-label">Degree</label>
              <input
                type="text"
                id="edu-degree-{index}"
                bind:value={editingResume.education[index].degree}
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
                bind:value={editingResume.education[index].field}
                placeholder="Computer Science"
                class="form-input"
              />
            </div>
          </div>
          <div class="form-group">
            <label for="edu-desc-{index}" class="form-label">Description</label>
            <textarea
              id="edu-desc-{index}"
              bind:value={editingResume.education[index].description}
              rows="4"
              placeholder="Honors, awards, achievements, relevant coursework..."
              class="form-input"
            ></textarea>
          </div>
        </div>
      </div>
    {:else}
      <!-- Preview -->

      <div class="cv-row">
        <div class="cv-row-side subtle">
          {#if edu.startedAt || edu.endedAt}
            <div>
              {edu.startedAt || ""} — {edu.endedAt || "Present"}
            </div>
          {/if}
          {#if edu.field}
            <div>{edu.field}</div>
          {/if}
        </div>
        <div class="cv-row-heading">
          <div>
            <h4 class="heading-3">{edu.degree || "Untitled Degree"}</h4>
            {#if edu.institution}
              <p class="subtle">at {edu.institution}</p>
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
          {#if edu.description}
            <p>{edu.description}</p>
          {/if}
        </div>
      </div>
    {/if}
  {/each}
</section>

<!-- Projects -->
<section class="cv-section">
  <div class="cv-row">
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

  {#each displayResume.projects as project, index}
    {#if isEditing("projects", index) && editingResume}
      <!-- Editor -->

      <div class="cv-row">
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
                bind:value={editingResume.projects[index].startedAt}
                placeholder="YYYY or YYYY-MM"
              />
            </div>
            <div class="form-group">
              <label for="project-end-{index}" class="form-label">
                End Date
              </label>
              <DatePicker
                id="project-end-{index}"
                bind:value={editingResume.projects[index].endedAt}
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

      <div class="cv-row">
        <div class="cv-row-side subtle">
          {#if project.startedAt || project.endedAt}
            <div>
              {project.startedAt || ""} — {project.endedAt || "Present"}
            </div>
          {/if}
        </div>
        <div class="cv-row-heading">
          {#if project.url}
            <a
              href={normalizeUrl(project.url)}
              target="_blank"
              class="heading-3 link"
            >
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
  <div class="cv-row">
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
    <div class="cv-row">
      <div><!-- skip column --></div>
      <div class="cv-row-main">
        <MultiSelectCombobox
          options={allSkills}
          bind:selected={editingResume.skills}
          placeholder="e.g., TypeScript"
          id="skills-combobox"
        />
      </div>
    </div>
  {:else if displayResume.skills.length > 0}
    <div>
      {#each Object.entries(skillsByCategory()) as [category, skills]}
        <div class="cv-row">
          <div class="cv-row-side subtle">{category}</div>
          <div class="cv-row-main">{skills.join(", ")}</div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="cv-row">
      <span><!-- skip columns --></span>
      <span class="cv-row-main">
        <p class="subtle">No skills added yet. Click Edit to add skills.</p>
      </span>
    </div>
  {/if}
</section>

<!-- Workplace Preferences -->
<section class="cv-section">
  <div class="cv-row">
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
    <div class="cv-row">
      <div><!-- skip column --></div>
      <div class="cv-row-main">
        <MultiSelectCombobox
          id="workplace-combobox"
          options={workplaceOptions}
          bind:selected={editingResume.preferredWorkplace}
          placeholder="Select workplace preferences"
        />
      </div>
    </div>
  {:else if displayResume.preferredWorkplace.length > 0}
    <div class="cv-row">
      <span><!-- skip column --></span>
      <span class="cv-row-main">
        {displayResume.preferredWorkplace.join(", ")}
      </span>
    </div>
  {:else}
    <div class="cv-row">
      <span><!-- skip column --></span>
      <span class="cv-row-main">
        <p class="subtle">No workplace preferences set. Click Edit to add.</p>
      </span>
    </div>
  {/if}
</section>

<!-- Languages -->
<section class="cv-section">
  <div class="cv-row">
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
    <div class="cv-row">
      <div><!-- skip column --></div>
      <div class="cv-row-main">
        <MultiSelectCombobox
          id="languages-combobox"
          options={languageOptions}
          bind:selected={editingResume.languages}
          placeholder="Select or add languages"
        />
      </div>
    </div>
  {:else if displayResume.languages.length > 0}
    <div class="cv-row">
      <span><!-- skip column --></span>
      <span class="cv-row-main">
        {displayResume.languages.join(", ")}
      </span>
    </div>
  {:else}
    <div class="cv-row">
      <span><!-- skip column --></span>
      <span class="cv-row-main">
        <p class="subtle">No languages added yet. Click Edit to add.</p>
      </span>
    </div>
  {/if}
</section>

<style>
  .heading-2 {
    text-transform: uppercase;
  }

  .cv-section {
    display: grid;
    gap: var(--space-8);
    margin-bottom: var(--space-12);
  }

  .cv-row {
    display: grid;
    grid-template-columns: 180px 1fr;
    column-gap: var(--space-8);
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
    /* align when text gets wrapped */
    text-align: right;
  }

  .cv-row-main {
    p {
      margin-top: 0;
      white-space: pre-line;
    }
  }

  @media (max-width: 640px) {
    .cv-row {
      grid-template-columns: 1fr;
      row-gap: var(--space-4);
    }

    .cv-row-side {
      justify-items: start;
    }
  }
</style>
