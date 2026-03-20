<script lang="ts">
  import type { Resume } from "./cv-parser";
  import { SKILLS_TAXONOMY } from "./cv-parser";
  import MultiSelectCombobox from "./multi-select-combobox.svelte";

  let { resume, onDone }: { resume: Resume; onDone?: () => void } = $props();

  // Create flat list of all skills from taxonomy
  const allSkills = [...new Set(Object.values(SKILLS_TAXONOMY).flat())].sort(
    (a, b) => a.toLowerCase().localeCompare(b.toLowerCase()),
  );

  function addExperience() {
    resume.experience.push({
      title: "",
      company: "",
      location: "",
      dateRange: { start: "", end: "" },
    });
  }

  function removeExperience(index: number) {
    resume.experience.splice(index, 1);
  }

  function addEducation() {
    resume.education.push({
      institution: "",
      degree: "",
      field: "",
      dateRange: { start: "", end: "" },
    });
  }

  function removeEducation(index: number) {
    resume.education.splice(index, 1);
  }

  function addProject() {
    resume.projects.push({
      name: "",
      description: "",
      dateRange: { start: "", end: "" },
    });
  }

  function removeProject(index: number) {
    resume.projects.splice(index, 1);
  }
</script>

<div class="edit-container">
  <h2 class="edit-title">Edit Resume</h2>

  <!-- Contact Info -->
  <section class="form-section">
    <h3 class="section-title">Contact Information</h3>
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
        <label for="contact-email" class="form-label">Email</label>
        <input
          type="email"
          id="contact-email"
          bind:value={resume.contact.email}
          placeholder="john@example.com"
          class="form-input"
        />
      </div>
      <div class="form-group">
        <label for="contact-phone" class="form-label">Phone</label>
        <input
          type="text"
          id="contact-phone"
          bind:value={resume.contact.phone}
          placeholder="+1 555-123-4567"
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
  </section>

  <!-- Summary -->
  <section class="form-section">
    <h3 class="section-title">Professional Summary</h3>
    <div class="form-group">
      <textarea
        bind:value={resume.summary}
        rows="4"
        placeholder="Enter your professional summary..."
        class="form-textarea"
      ></textarea>
    </div>
  </section>

  <!-- Experience -->
  <section class="form-section">
    <h3 class="section-title">Work Experience</h3>
    {#each resume.experience as job, index}
      <div class="card" style="margin-bottom: var(--space-4);">
        <div class="card--header">
          <h4 class="card--title">Experience {index + 1}</h4>
          <button
            class="btn btn--danger btn--sm"
            onclick={() => removeExperience(index)}
            type="button"
          >
            Remove
          </button>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label for="job-title-{index}" class="form-label">Job Title</label>
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
            <label for="job-location-{index}" class="form-label">Location</label
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
        <div class="form-row" style="margin-top: var(--space-4);">
          <div class="form-group">
            <label for="job-start-{index}" class="form-label">Start Date</label>
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
        <div class="form-group" style="margin-top: var(--space-4);">
          <label for="job-desc-{index}" class="form-label">Description</label>
          <textarea
            id="job-desc-{index}"
            bind:value={job.description}
            rows="6"
            placeholder="Describe your role, responsibilities, and achievements..."
            class="form-textarea"
          ></textarea>
        </div>
      </div>
    {/each}
    <button class="btn btn--success" onclick={addExperience} type="button">
      + Add Experience
    </button>
  </section>

  <!-- Education -->
  <section class="form-section">
    <h3 class="section-title">Education</h3>
    {#each resume.education as edu, index}
      <div class="card" style="margin-bottom: var(--space-4);">
        <div class="card--header">
          <h4 class="card--title">Education {index + 1}</h4>
          <button
            class="btn btn--danger btn--sm"
            onclick={() => removeEducation(index)}
            type="button"
          >
            Remove
          </button>
        </div>
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
        <div class="form-row" style="margin-top: var(--space-4);">
          <div class="form-group">
            <label for="edu-start-{index}" class="form-label">Start Date</label>
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
        <div class="form-group" style="margin-top: var(--space-4);">
          <label for="edu-desc-{index}" class="form-label">Description</label>
          <textarea
            id="edu-desc-{index}"
            bind:value={edu.description}
            rows="4"
            placeholder="Honors, awards, achievements, relevant coursework..."
            class="form-textarea"
          ></textarea>
        </div>
      </div>
    {/each}
    <button class="btn btn--success" onclick={addEducation} type="button">
      + Add Education
    </button>
  </section>

  <!-- Projects -->
  <section class="form-section">
    <h3 class="section-title">Projects</h3>
    {#each resume.projects as project, index}
      <div class="card" style="margin-bottom: var(--space-4);">
        <div class="card--header">
          <h4 class="card--title">Project {index + 1}</h4>
          <button
            class="btn btn--danger btn--sm"
            onclick={() => removeProject(index)}
            type="button"
          >
            Remove
          </button>
        </div>
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
        <div class="form-row" style="margin-top: var(--space-4);">
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
            <label for="project-end-{index}" class="form-label">End Date</label>
            <input
              type="text"
              id="project-end-{index}"
              bind:value={project.dateRange!.end}
              placeholder="Present"
              class="form-input"
            />
          </div>
        </div>
        <div class="form-group" style="margin-top: var(--space-4);">
          <label for="project-desc-{index}" class="form-label"
            >Description</label
          >
          <textarea
            id="project-desc-{index}"
            bind:value={project.description}
            rows="3"
            placeholder="Brief description of the project..."
            class="form-textarea"
          ></textarea>
        </div>
      </div>
    {/each}
    <button class="btn btn--success" onclick={addProject} type="button">
      + Add Project
    </button>
  </section>

  <!-- Skills -->
  <section class="form-section">
    <h3 class="section-title">Skills</h3>
    <MultiSelectCombobox
      options={allSkills}
      bind:selected={resume.skills}
      label="Select your skills (type to search or add custom)"
      placeholder="e.g., TypeScript"
      id="skills-combobox"
    />
  </section>

  {#if onDone}
    <button
      class="btn btn--primary btn--block btn--lg"
      onclick={onDone}
      type="button"
    >
      Done Editing
    </button>
  {/if}
</div>
