<script lang="ts">
  import type { Resume } from "./cv-parser";
  import { SKILLS_TAXONOMY } from "./cv-parser";
  import MultiSelectCombobox from "./multi-select-combobox.svelte";

  let { resume = $bindable() }: { resume: Resume } = $props();

  // Track which section/card is being edited
  // Format: 'contact', 'summary', 'experience-0', 'education-2', 'skills'
  let editingId = $state<string | null>(null);

  // Create flat list of all skills from taxonomy
  const allSkills = [...new Set(Object.values(SKILLS_TAXONOMY).flat())].sort(
    (a, b) => a.toLowerCase().localeCompare(b.toLowerCase()),
  );

  // Group skills by category for display
  const skillsByCategory = $derived(() => {
    const grouped: Record<string, string[]> = {};
    for (const [category, skills] of Object.entries(SKILLS_TAXONOMY)) {
      const matched = skills.filter((skill) =>
        resume.skills.some((s) => s.toLowerCase() === skill.toLowerCase()),
      );
      if (matched.length > 0) {
        grouped[category] = matched;
      }
    }
    // Add "Other" category for custom skills not in taxonomy
    const taxonomySkills = new Set(Object.values(SKILLS_TAXONOMY).flat());
    const otherSkills = resume.skills.filter(
      (skill) => !taxonomySkills.has(skill),
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
    const targetId = index !== undefined ? `${section}-${index}` : section;
    editingId = targetId;
  }

  function stopEditing() {
    editingId = null;
  }

  function addExperience() {
    resume.experience.unshift({
      title: "",
      company: "",
      location: "",
      dateRange: { start: "", end: "" },
    });
    // Start editing the new entry (index 0 after unshift)
    startEditing("experience", 0);
  }

  function removeExperience(index: number) {
    resume.experience.splice(index, 1);
    // If we were editing this card, stop editing
    if (isEditing("experience", index)) {
      stopEditing();
    }
  }

  function addEducation() {
    resume.education.unshift({
      institution: "",
      degree: "",
      field: "",
      dateRange: { start: "", end: "" },
    });
    startEditing("education", 0);
  }

  function removeEducation(index: number) {
    resume.education.splice(index, 1);
    if (isEditing("education", index)) {
      stopEditing();
    }
  }

  function addProject() {
    resume.projects.unshift({
      name: "",
      description: "",
      dateRange: { start: "", end: "" },
    });
    startEditing("projects", 0);
  }

  function removeProject(index: number) {
    resume.projects.splice(index, 1);
    if (isEditing("projects", index)) {
      stopEditing();
    }
  }
</script>

<!-- Contacts and summary -->
<section class="cv-section" aria-label="Contacts and summary">
  {#if isEditing("contact")}
    <!-- Editor -->

    <div class="form-stack">
      <div class="form-grid">
        <div class="form-group">
          <label for="contact-name" class="form-label">Name</label>
          <input
            type="text"
            id="contact-name"
            bind:value={resume.contact.name}
            placeholder="John Doe"
            class="form-input"
          />
        </div>
        <div class="form-group">
          <label for="contact-location" class="form-label">Location</label>
          <input
            type="text"
            id="contact-location"
            bind:value={resume.contact.location}
            placeholder="San Francisco, CA"
            class="form-input"
          />
        </div>
        <div class="form-group">
          <label for="contact-email" class="form-label">Email</label>
          <input
            type="email"
            id="contact-email"
            bind:value={resume.contact.email}
            placeholder="john@example.com"
            class="form-input"
          />
        </div>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label for="contact-linkedin" class="form-label">LinkedIn</label>
          <input
            type="text"
            id="contact-linkedin"
            bind:value={resume.contact.linkedin}
            placeholder="linkedin.com/in/johndoe"
            class="form-input"
          />
        </div>
        <div class="form-group">
          <label for="contact-github" class="form-label">GitHub</label>
          <input
            type="text"
            id="contact-github"
            bind:value={resume.contact.github}
            placeholder="github.com/johndoe"
            class="form-input"
          />
        </div>
        <div class="form-group">
          <label for="contact-website" class="form-label">Website</label>
          <input
            type="text"
            id="contact-website"
            bind:value={resume.contact.website}
            placeholder="https://johndoe.com"
            class="form-input"
          />
        </div>
      </div>
      <div class="form-group">
        <label for="contact-summary" class="form-label">Bio / Summary</label>
        <textarea
          id="contact-summary"
          bind:value={resume.summary}
          rows="4"
          placeholder="Brief professional summary..."
          class="form-input"
        ></textarea>
      </div>
      <div class="card-actions">
        <button
          class="btn btn--primary btn--icon"
          onclick={() => stopEditing()}
          type="button"
          aria-label="Save"
        >
          <svg width="20" height="20">
            <use href="#icon-check" />
          </svg>
        </button>
      </div>
    </div>
  {:else}
    <!-- Preview -->

    <div class="cv-row">
      <div><!-- skip column --></div>
      <div class="cv-row-heading">
        <h2 class="heading-1">{resume.contact.name || "Your Name"}</h2>
        <button
          class="icon-button"
          aria-label="Edit contacts and summary"
          onclick={() => startEditing("contact")}
        >
          <svg width="16" height="16">
            <use href="#icon-pencil" />
          </svg>
        </button>
      </div>
    </div>
    <div class="cv-row">
      <div class="cv-row-side subtle">
        {#if resume.contact.location}
          <div>
            {resume.contact.location}
            <svg width="14" height="14"><use href="#icon-location" /></svg>
          </div>
        {/if}
        {#if resume.contact.email}
          <a href="mailto:{resume.contact.email}" class="link">
            {resume.contact.email}
            <svg width="14" height="14"><use href="#icon-email" /></svg>
          </a>
        {/if}
        {#if resume.contact.linkedin}
          <a
            href="https://{resume.contact.linkedin}"
            target="_blank"
            class="link"
          >
            LinkedIn
            <svg width="14" height="14"><use href="#icon-linkedin" /></svg>
          </a>
        {/if}
        {#if resume.contact.github}
          <a
            href="https://{resume.contact.github}"
            target="_blank"
            class="link"
          >
            <span>GitHub</span>
            <svg width="14" height="14"><use href="#icon-github" /></svg>
          </a>
        {/if}
        {#if resume.contact.website}
          <a href={resume.contact.website} target="_blank" class="link">
            Website
            <svg width="14" height="14"><use href="#icon-website" /></svg>
          </a>
        {/if}
      </div>
      <div class="cv-row-main">
        {#if resume.summary}
          <p>{resume.summary}</p>
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
      <h3 class="heading-2 subtle">Work Experience</h3>
      <button
        class="icon-button"
        onclick={addExperience}
        aria-label="Add Experience"
      >
        <svg width="20" height="20">
          <use href="#icon-plus" />
        </svg>
      </button>
    </heading>
  </div>

  {#each resume.experience as job, index}
    {#if isEditing("experience", index)}
      <!-- Editor -->

      <div
        class="section-entry"
        class:card--editing={isEditing("experience", index)}
      >
        <div class="form-stack">
          <div class="form-grid">
            <div class="form-group">
              <label for="job-title-{index}" class="form-label">Job Title</label
              >
              <input
                type="text"
                id="job-title-{index}"
                bind:value={job.title}
                placeholder="Software Engineer"
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label for="company-{index}" class="form-label">Company</label>
              <input
                type="text"
                id="company-{index}"
                bind:value={job.company}
                placeholder="TechCorp Inc."
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label for="job-location-{index}" class="form-label"
                >Location</label
              >
              <input
                type="text"
                id="job-location-{index}"
                bind:value={job.location}
                placeholder="San Francisco, CA (or Remote)"
                class="form-input"
              />
            </div>
          </div>
          <div class="form-grid">
            <div class="form-group">
              <label for="job-start-{index}" class="form-label"
                >Start Date</label
              >
              <input
                type="text"
                id="job-start-{index}"
                bind:value={job.dateRange!.start}
                placeholder="Jan 2020"
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label for="job-end-{index}" class="form-label">End Date</label>
              <input
                type="text"
                id="job-end-{index}"
                bind:value={job.dateRange!.end}
                placeholder="Present"
                class="form-input"
              />
            </div>
          </div>
          <div class="form-group">
            <label for="job-desc-{index}" class="form-label">Description</label>
            <textarea
              id="job-desc-{index}"
              bind:value={job.description}
              rows="6"
              placeholder="Describe your role, responsibilities, and achievements..."
              class="form-input"
            ></textarea>
          </div>
          <div class="card-actions">
            <button
              class="btn btn--primary btn--icon"
              onclick={() => stopEditing()}
              type="button"
              aria-label="Save"
            >
              <svg width="20" height="20">
                <use href="#icon-check" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    {:else}
      <!-- Preview -->

      <div class="cv-row">
        <div class="cv-row-side subtle">
          {#if job.dateRange?.start || job.dateRange?.end}
            <div>
              {job.dateRange?.start || ""} — {job.dateRange?.end || "Present"}
            </div>
          {/if}
          {#if job.location}
            <div>{job.location}</div>
          {/if}
        </div>
        <div class="cv-row-heading">
          <div>
            <h4 class="heading-3">{job.title || "Untitled Position"}</h4>
            {#if job.company}
              <p class="subtle">at {job.company}</p>
            {/if}
          </div>
          <div class="cv-actions">
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
      <h3 class="heading-2 subtle">Education</h3>
      <button
        class="icon-button"
        aria-label="Add Education"
        onclick={addEducation}
      >
        <svg width="20" height="20">
          <use href="#icon-plus" />
        </svg>
      </button>
    </heading>
  </div>

  {#each resume.education as edu, index}
    {#if isEditing("education", index)}
      <!-- Editor -->

      <div
        class="section-entry"
        class:card--editing={isEditing("education", index)}
      >
        <div class="form-stack">
          <div class="form-grid">
            <div class="form-group">
              <label for="edu-institution-{index}" class="form-label"
                >Institution</label
              >
              <input
                type="text"
                id="edu-institution-{index}"
                bind:value={edu.institution}
                placeholder="University of Example"
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label for="edu-degree-{index}" class="form-label">Degree</label>
              <input
                type="text"
                id="edu-degree-{index}"
                bind:value={edu.degree}
                placeholder="Bachelor of Science"
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label for="edu-field-{index}" class="form-label"
                >Field of Study</label
              >
              <input
                type="text"
                id="edu-field-{index}"
                bind:value={edu.field}
                placeholder="Computer Science"
                class="form-input"
              />
            </div>
          </div>
          <div class="form-grid">
            <div class="form-group">
              <label for="edu-start-{index}" class="form-label"
                >Start Date</label
              >
              <input
                type="text"
                id="edu-start-{index}"
                bind:value={edu.dateRange!.start}
                placeholder="Sep 2016"
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label for="edu-end-{index}" class="form-label">End Date</label>
              <input
                type="text"
                id="edu-end-{index}"
                bind:value={edu.dateRange!.end}
                placeholder="May 2020"
                class="form-input"
              />
            </div>
          </div>
          <div class="form-group">
            <label for="edu-desc-{index}" class="form-label">Description</label>
            <textarea
              id="edu-desc-{index}"
              bind:value={edu.description}
              rows="4"
              placeholder="Honors, awards, achievements, relevant coursework..."
              class="form-input"
            ></textarea>
          </div>
          <div class="card-actions">
            <button
              class="btn btn--primary btn--icon"
              onclick={() => stopEditing()}
              type="button"
              aria-label="Save"
            >
              <svg width="20" height="20">
                <use href="#icon-check" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    {:else}
      <!-- Preview -->

      <div class="cv-row">
        <div class="cv-row-side subtle">
          {#if edu.dateRange?.start || edu.dateRange?.end}
            <div>
              {edu.dateRange?.start || ""} — {edu.dateRange?.end || "Present"}
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
          <div class="cv-actions">
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
      <h3 class="heading-2">Projects</h3>
      <button class="icon-button" aria-label="Add Project" onclick={addProject}>
        <svg width="20" height="20">
          <use href="#icon-plus" />
        </svg>
      </button>
    </header>
  </div>

  {#each resume.projects as project, index}
    {#if isEditing("projects", index)}
      <!-- Editor -->

      <div
        class="section-entry"
        class:card--editing={isEditing("projects", index)}
      >
        <div class="form-stack">
          <div class="form-grid">
            <div class="form-group">
              <label for="project-name-{index}" class="form-label"
                >Project Name</label
              >
              <input
                type="text"
                id="project-name-{index}"
                bind:value={project.name}
                placeholder="E-commerce Platform"
                class="form-input"
              />
            </div>
          </div>
          <div class="form-grid">
            <div class="form-group">
              <label for="project-start-{index}" class="form-label"
                >Start Date</label
              >
              <input
                type="text"
                id="project-start-{index}"
                bind:value={project.dateRange!.start}
                placeholder="Jan 2023"
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label for="project-end-{index}" class="form-label"
                >End Date</label
              >
              <input
                type="text"
                id="project-end-{index}"
                bind:value={project.dateRange!.end}
                placeholder="Present"
                class="form-input"
              />
            </div>
          </div>
          <div class="form-group">
            <label for="project-desc-{index}" class="form-label"
              >Description</label
            >
            <textarea
              id="project-desc-{index}"
              bind:value={project.description}
              rows="3"
              placeholder="Brief description of the project..."
              class="form-input"
            ></textarea>
          </div>
          <div class="card-actions">
            <button
              class="btn btn--primary btn--icon"
              onclick={() => stopEditing()}
              type="button"
              aria-label="Save"
            >
              <svg width="20" height="20">
                <use href="#icon-check" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    {:else}
      <!-- Preview -->

      <div class="cv-row">
        <div class="cv-row-side subtle">
          {#if project.dateRange?.start || project.dateRange?.end}
            <div>
              {project.dateRange?.start || ""} — {project.dateRange?.end ||
                "Present"}
            </div>
          {/if}
        </div>
        <div class="cv-row-heading">
          <h4 class="heading-3">{project.name || "Untitled Project"}</h4>
          <div class="cv-actions">
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
      <h3 class="heading-2 subtle">Technical Skills</h3>
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
    </header>
  </div>

  {#if isEditing("skills")}
    <MultiSelectCombobox
      options={allSkills}
      bind:selected={resume.skills}
      label="Select your skills (type to search or add custom)"
      placeholder="e.g., TypeScript"
      id="skills-combobox"
    />
  {:else if resume.skills.length > 0}
    <div>
      {#each Object.entries(skillsByCategory()) as [category, skills]}
        <div class="cv-row">
          <span class="cv-row-side subtle">{category}</span>
          <span class="cv-row-main">{skills.join(", ")}</span>
        </div>
      {/each}
    </div>
  {:else}
    <p class="subtle">No skills added yet. Click Edit to add skills.</p>
  {/if}
</section>

<style>
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

  .cv-actions {
    display: flex;
    align-items: center;
    gap: var(--space-1);
  }

  .cv-row-side {
    display: grid;
    grid-auto-rows: min-content;
    justify-items: end;
  }

  .cv-row-main {
    p {
      margin-top: 0;
    }
  }
</style>
