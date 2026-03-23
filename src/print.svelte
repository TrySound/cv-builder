<script lang="ts">
  import { groupSkillsByCategory, type Resume } from "./cv-parser";

  let { resume }: { resume: Resume } = $props();
</script>

<div class="page" hidden>
  <header class="header">
    {#if resume.contact.name}
      <h2 class="display">{resume.contact.name}</h2>
    {/if}
    <div class="contact-info">
      {#if resume.contact.email}
        <span class="caption">{resume.contact.email}</span>
      {/if}
      {#if resume.contact.location}
        <span class="caption">{resume.contact.location}</span>
      {/if}
      {#if resume.contact.linkedin}
        <span class="caption">{resume.contact.linkedin}</span>
      {/if}
      {#if resume.contact.github}
        <span class="caption">{resume.contact.github}</span>
      {/if}
      {#if resume.contact.website}
        <span class="caption">{resume.contact.website}</span>
      {/if}
    </div>
  </header>

  {#if resume.summary}
    <section class="section">
      <h3 class="heading">Summary</h3>
      <p class="body">{resume.summary}</p>
    </section>
  {/if}

  {#if resume.experience.length > 0}
    <section class="section">
      <h3 class="heading">Experience</h3>
      <div class="stack">
        {#each resume.experience as job}
          <div class="stack-item">
            <div class="space-between">
              <h4 class="title">{job.title}</h4>
              <span class="caption">
                {job.dateRange?.start || ""} - {job.dateRange?.end || ""}
              </span>
            </div>
            <div class="space-between">
              <span class="caption">{job.company}</span>
              {#if job.location}
                <span class="caption">{job.location}</span>
              {/if}
            </div>
            {#if job.description}
              <p class="body">{job.description}</p>
            {/if}
          </div>
        {/each}
      </div>
    </section>
  {/if}

  {#if resume.education.length > 0}
    <section class="section">
      <h3 class="heading">Education</h3>
      <div class="stack">
        {#each resume.education as edu}
          <div class="stack-item">
            <div class="space-between">
              <h4 class="title">{edu.institution}</h4>
              <span class="caption">
                {edu.dateRange?.start || ""} - {edu.dateRange?.end || ""}
              </span>
            </div>
            <div class="space-between">
              {#if edu.degree}
                <span class="caption">{edu.degree}</span>
              {/if}
              {#if edu.field}
                <span class="caption">{edu.field}</span>
              {/if}
            </div>
            {#if edu.description}
              <p class="body">{edu.description}</p>
            {/if}
          </div>
        {/each}
      </div>
    </section>
  {/if}

  {#if resume.projects.length > 0}
    <section class="section">
      <h3 class="heading">Projects</h3>
      <div class="stack">
        {#each resume.projects as project}
          <div class="stack-item">
            <div class="space-between">
              <h4 class="title">{project.name}</h4>
              <span class="caption">
                {project.dateRange?.start || ""} - {project.dateRange?.end ||
                  ""}
              </span>
            </div>
            {#if project.description}
              <p class="body">{project.description}</p>
            {/if}
          </div>
        {/each}
      </div>
    </section>
  {/if}

  {#if resume.skills.length > 0}
    <section class="section">
      <h3 class="heading">Skills</h3>
      {#each Object.entries(groupSkillsByCategory(resume.skills)) as [category, skills]}
        <div>
          <span class="label">{category}:</span>
          <span class="caption">{skills.join(", ")}</span>
        </div>
      {/each}
    </section>
  {/if}
</div>

<style>
  .page {
    --page-width: 210mm;
    --page-height: 297mm;
    --page-padding: 8mm;
    --page-margin: 8mm;

    --font-sm: 3.5mm;
    --font-md: 4.2mm;
    --font-lg: 5mm;
    --font-xl: 8mm;

    --space-sm: 1mm;
    --space-lg: 2mm;
    --space-xl: 3mm;

    width: var(--page-width);
    min-height: var(--page-height);
    padding: var(--page-padding);
    margin: var(--page-margin) auto;
    background: white;
    box-shadow:
      0 4px 6px -1px rgba(0, 0, 0, 0.1),
      0 2px 4px -1px rgba(0, 0, 0, 0.06);
    color: #000;
    line-height: 1.4;
    font-size: var(--font-sm);

    /* override global styles */
    * {
      color: black;
    }
  }

  .display {
    font-size: var(--font-xl);
    font-weight: 700;
    margin: 0;
  }

  .heading {
    font-size: var(--font-lg);
    font-weight: 600;
    margin: 0 0 var(--space-sm) 0;
    text-transform: uppercase;
  }

  .body {
    font-size: var(--font-sm);
    line-height: 1.25;
    margin: 0;
  }

  .title {
    font-size: var(--font-md);
    font-weight: 600;
    margin: 0;
  }

  .caption {
    font-size: var(--font-md);
  }

  .label {
    font-weight: 600;
    text-transform: capitalize;
    margin-right: var(--space-sm);
  }

  .header {
    margin-bottom: var(--space-xl);
  }

  .contact-info {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-lg);
  }

  .contact-info > .caption:not(:last-child)::after {
    content: "•";
    margin-left: var(--space-lg);
  }

  .section {
    margin-bottom: var(--space-xl);
  }

  .space-between {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: var(--space-sm);
  }

  .stack {
    display: grid;
    gap: var(--space-xl);
  }

  .stack-item {
    page-break-inside: avoid;
  }

  @media (max-width: 640px) {
    .page {
      width: 100%;
      --page-padding: 4mm;
      --page-margin: 4mm;
      --font-xl: 6mm;
      --space-lg: 1mm;
    }

    .contact-info {
      flex-direction: column;
    }

    .contact-info > .caption:not(:last-child)::after {
      content: "";
      margin-left: 0;
    }

    .space-between {
      flex-direction: column;
    }
  }

  @media print {
    @page {
      size: A4;
    }

    .page {
      display: block;
      width: 100%;
      min-height: auto;
      box-shadow: none;
      background: white;
      padding: 0;
      margin: 0;
    }

    .section {
      page-break-inside: avoid;
    }

    .stack-item {
      page-break-inside: avoid;
    }
  }
</style>
