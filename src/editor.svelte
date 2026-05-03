<script lang="ts">
  import type { Resume } from "$lib/jsonresume";
  import MultiSelectCombobox from "$lib/multi-select-combobox.svelte";
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

  // Define options for comboboxes (as {value, label} objects)
  const workplaceOptions = [
    { value: "onsite", label: "onsite" },
    { value: "remote", label: "remote" },
    { value: "hybrid", label: "hybrid" },
  ];
  const languageOptions = [
    { value: "English", label: "English" },
    { value: "Spanish", label: "Spanish" },
    { value: "French", label: "French" },
    { value: "German", label: "German" },
    { value: "Italian", label: "Italian" },
    { value: "Portuguese", label: "Portuguese" },
    { value: "Russian", label: "Russian" },
    { value: "Chinese", label: "Chinese" },
    { value: "Japanese", label: "Japanese" },
    { value: "Korean", label: "Korean" },
    { value: "Arabic", label: "Arabic" },
    { value: "Hindi", label: "Hindi" },
    { value: "Dutch", label: "Dutch" },
    { value: "Swedish", label: "Swedish" },
    { value: "Polish", label: "Polish" },
    { value: "Turkish", label: "Turkish" },
    { value: "Vietnamese", label: "Vietnamese" },
    { value: "Thai", label: "Thai" },
    { value: "Indonesian", label: "Indonesian" },
    { value: "Hebrew", label: "Hebrew" },
  ];

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
      // sort the same way as displayed data
      work: sortByDate(resume.work ?? []),
      education: sortByDate(resume.education ?? []),
      projects: sortByDate(resume.projects ?? []),
      volunteer: resume.volunteer ?? [],
      awards: resume.awards ?? [],
      certificates: resume.certificates ?? [],
      publications: resume.publications ?? [],
      skills: resume.skills ?? [],
      languages: resume.languages ?? [],
      interests: resume.interests ?? [],
      references: resume.references ?? [],
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

  function formatDateShort(dateString: string | undefined): string {
    if (!dateString) {
      return "";
    }
    // render year as is
    if (dateString.length === 4) {
      return dateString;
    }
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  }
</script>

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
                    editingResume?.work[index].extension?.employmentType ?? "",
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
            <label for="job-desc-{index}" class="form-label">Description</label>
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
            {@const startDate = formatDateShort(job.startDate)}
            {@const endDate = formatDateShort(job.endDate)}
            <div>
              {startDate} — {endDate || "Present"}
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
        <div>
          <div class="space-between">
            <div class="margin-trim-block">
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
              <label for="edu-degree-{index}" class="form-label">Degree</label>
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
            <label for="edu-desc-{index}" class="form-label">Description</label>
            <textarea
              id="edu-desc-{index}"
              rows="4"
              placeholder="Honors, awards, achievements, relevant coursework..."
              class="form-input"
              bind:value={
                () =>
                  editingResume?.education[index].extension?.description ?? "",
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
            {@const startDate = formatDateShort(edu.startDate)}
            {@const endDate = formatDateShort(edu.endDate)}
            <div>
              {startDate} — {endDate || "Present"}
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
            {@const startDate = formatDateShort(project.startDate)}
            {@const endDate = formatDateShort(project.endDate)}
            <div>
              {startDate} — {endDate || "Present"}
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
            () =>
              (editingResume?.extension?.preferredWorkplaces ?? []).map((w) => ({
                value: w,
                label: w,
              })),
            (newWorkplaces) => {
              if (editingResume) {
                editingResume.extension.preferredWorkplaces = newWorkplaces.map(
                  (w) => w.label,
                );
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
              (editingResume?.languages ?? []).map((item) => ({
                value: item.language ?? "",
                label: item.language ?? "",
              })),
            (newLanguages) => {
              if (editingResume) {
                editingResume.languages = newLanguages.map((item) => ({
                  language: item.label,
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

  @media (max-width: 640px) {
    .cv-row-side {
      justify-items: start;
    }
  }
</style>
