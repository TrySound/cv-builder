<script lang="ts">
  import { SKILLS_TAXONOMY } from "$lib/cv-parser";
  import type { Resume } from "$lib/jsonresume";

  let { resume }: { resume: Resume } = $props();

  const stripHttps = (url: string) => {
    if (url.startsWith("https://")) {
      return url.slice("https://".length);
    }
    return url;
  };

  function groupSkillsByCategory(skills: { name?: string }[]): {
    [category: string]: string[];
  } {
    const grouped: { [category: string]: string[] } = {};

    // Create reverse lookup map: skill -> category
    const skillToCategory: Record<string, string> = {};
    for (const [category, categorySkills] of Object.entries(SKILLS_TAXONOMY)) {
      for (const skill of categorySkills) {
        skillToCategory[skill.toLowerCase()] = category;
      }
    }

    for (const skill of skills) {
      const skillName = skill.name ?? "";
      if (!skillName) continue;
      const category = skillToCategory[skillName.toLowerCase()] ?? "other";
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(skillName);
    }

    return grouped;
  }
</script>

<div class="page" hidden>
  <header class="header">
    {#if resume.basics?.name}
      <h2 class="display">{resume.basics.name}</h2>
    {/if}
    <div class="contact-info">
      {#if resume.basics?.location?.address}
        <span class="body">{resume.basics.location.address}</span>
      {/if}
      {#if resume.basics?.email}
        {#if resume.basics?.location?.address}
          •
        {/if}
        <a class="body" href="mailto:{resume.basics.email}">
          {resume.basics.email}
        </a>
      {/if}
      {#if resume.basics?.profiles}
        {#each resume.basics.profiles as profile, index}
          {#if resume.basics?.location?.address || resume.basics?.email || index > 0}
            •
          {/if}
          <a class="body" href={profile.url}>{stripHttps(profile.url)}</a>
        {/each}
      {/if}
    </div>
  </header>

  {#if resume.basics?.summary}
    <section class="section">
      <h3 class="heading">Summary</h3>
      <p class="body">{resume.basics.summary}</p>
    </section>
  {/if}

  {#if resume.work && resume.work.length > 0}
    <section class="section">
      <h3 class="heading">Experience</h3>
      <div class="stack">
        {#each resume.work as job}
          <div class="stack-item">
            <div class="space-between">
              <h4 class="title">{job.position}</h4>
              <span class="caption">
                {job.startDate || ""} - {job.endDate || "Present"}
              </span>
            </div>
            <div class="space-between">
              <span class="caption">{job.name}</span>
              {#if job.location}
                <span class="caption">{job.location}</span>
              {/if}
            </div>
            {#if job.summary}
              <p class="body">{job.summary}</p>
            {/if}
          </div>
        {/each}
      </div>
    </section>
  {/if}

  {#if resume.education && resume.education.length > 0}
    <section class="section">
      <h3 class="heading">Education</h3>
      <div class="stack">
        {#each resume.education as edu}
          <div class="stack-item">
            <div class="space-between">
              <h4 class="title">{edu.institution}</h4>
              <span class="caption">
                {edu.startDate || ""} - {edu.endDate || "Present"}
              </span>
            </div>
            <div class="space-between">
              {#if edu.studyType}
                <span class="caption">{edu.studyType}</span>
              {/if}
              {#if edu.area}
                <span class="caption">{edu.area}</span>
              {/if}
            </div>
            {#if edu.extension?.description}
              <p class="body">{edu.extension.description}</p>
            {/if}
          </div>
        {/each}
      </div>
    </section>
  {/if}

  <!-- projects takes too much space which maybe make sense to spend on more work experience
  {#if resume.projects && resume.projects.length > 0}
    <section class="section">
      <h3 class="heading">Projects</h3>
      <div class="stack">
        {#each resume.projects as project}
          <div class="stack-item">
            <div class="space-between">
              <h4 class="title">{project.name}</h4>
              <span class="caption">
                {project.startDate || ""} - {project.endDate || "Present"}
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
  -->

  {#if resume.skills && resume.skills.length > 0}
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
    white-space: pre-line;
  }

  .title {
    font-size: var(--font-md);
    font-weight: 600;
    margin: 0;
  }

  .caption {
    font-size: var(--font-sm);
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

    .contact-info > *:not(:last-child)::after {
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

    .stack-item {
      page-break-inside: avoid;
    }
  }
</style>
