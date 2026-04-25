<script lang="ts">
  import type { Resume } from "$lib/jsonresume";
  import Topbar from "$lib/topbar.svelte";
  import UploadResumeDialog from "$lib/upload-resume-dialog.svelte";
  import { getProfileRecommendations } from "$lib/recommendation.remote";
  import {
    getMemberProfile,
    getProfile,
    updateMemberProfile,
  } from "$lib/profile.remote";
  import { formatDate } from "$lib/date";
  import Editor from "../../../editor.svelte";
  import Print from "../../../print.svelte";
  import { page } from "$app/state";

  let { data } = $props();

  const basicProfile = $derived(
    await getProfile({ handle: data.profile.handle }),
  );

  // SEO metadata
  const profileName = $derived(basicProfile.name ?? data.profile.handle);
  const profileDescription = $derived(
    `View ${profileName}'s professional profile on weareonhire!`,
  );
  const seoTitle = $derived(
    basicProfile.title
      ? `${profileName} - ${basicProfile.title} | weareonhire!`
      : `${profileName} | weareonhire!`,
  );
  const personSchema = $derived({
    "@context": "https://schema.org",
    "@type": "Person",
    name: profileName,
    identifier: data.profile.handle,
    jobTitle: basicProfile.title ?? undefined,
    description: profileDescription,
    url: `https://weareonhire.com/profile/${data.profile.handle}`,
    sameAs: [`https://bsky.app/profile/${data.profile.handle}`],
  });

  const isOwnProfile = $derived(data.handle === data.profile.handle);

  // Load resume via remote query
  const profile = $derived(getMemberProfile({ handle: data.profile.handle }));

  // Load recommendations via remote query
  const recommendations = $derived(
    getProfileRecommendations({ handle: data.profile.handle }),
  );

  let saveMessage = $state("");

  async function handleSave(resume: Resume) {
    saveMessage = "";
    // optimistically update resume before mutation
    profile.set(resume);
    try {
      await updateMemberProfile(resume);
      // Query will be refreshed automatically by the command
    } catch (e: any) {
      saveMessage = e.message || "Failed to save profile";
    }
  }
</script>

<svelte:head>
  <title>{seoTitle}</title>
  <meta name="description" content={profileDescription} />

  <!-- Open Graph -->
  <meta property="og:title" content={seoTitle} />
  <meta property="og:description" content={profileDescription} />
  <meta property="og:type" content="profile" />
  <meta property="og:url" content={page.url.toString()} />
  <meta property="og:image" content="{page.url.origin}/og-image.png" />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={seoTitle} />
  <meta name="twitter:description" content={profileDescription} />
  <meta name="twitter:image" content="{page.url.origin}/og-image.png" />

  <!-- Structured Data -->
  {@html `<script type="application/ld+json">${JSON.stringify(personSchema)}</script>`}
</svelte:head>

<div class="container">
  <Topbar handle={data.handle} />

  <div class="actions">
    {#if isOwnProfile}
      <button
        type="button"
        class="icon-button"
        aria-label="Upload resume"
        commandfor="upload-resume-dialog"
        command="show-modal"
      >
        <svg width="20" height="20">
          <use href="#icon-upload" />
        </svg>
      </button>
    {/if}
    <button
      type="button"
      class="icon-button"
      aria-label="Print resume"
      onclick={() => window.print()}
    >
      <svg width="20" height="20">
        <use href="#icon-print" />
      </svg>
    </button>
  </div>

  <div style="height: var(--space-4)"></div>

  {#if saveMessage}
    <div
      class="save-message alert"
      class:alert-success={!saveMessage.includes("Failed")}
      class:alert-error={saveMessage.includes("Failed")}
    >
      {saveMessage}
    </div>
  {/if}

  <div class="editor-container">
    {#if profile.current}
      <Editor
        resume={profile.current}
        onSave={handleSave}
        readonly={!isOwnProfile}
      />
    {:else}
      <div class="spinner-container">
        <div class="spinner"></div>
        <span class="subtle">Loading profile...</span>
      </div>
    {/if}
  </div>

  <!-- Recommendations Section -->
  <section
    class="recommendations-section"
    aria-label="Recommendations from other members"
  >
    <div class="row">
      <div><!-- skip column --></div>
      <h2 class="heading-2 subtle">Recommendations</h2>
    </div>

    <div>
      {#each recommendations.current?.recommendations as item}
        <article id="recommendation-{item.id}" class="row recommendation">
          <div>
            <time class="subtle" datetime={item.createdAt}>
              {formatDate(item.createdAt)}
            </time>
          </div>
          <div class="margin-trim-block">
            <p>
              <a href="/profile/{item.authorHandle}" class="link">
                {item.authorName || item.authorHandle}
              </a>
            </p>
            <p>
              {item.reason}
            </p>
          </div>
        </article>
      {:else}
        {#if recommendations.ready}
          <div class="row">
            <div><!-- skip column --></div>
            <p class="subtle">The user has not been recommended yet</p>
          </div>
        {/if}
      {/each}
    </div>
  </section>
</div>

<UploadResumeDialog onUpload={handleSave} />

{#if profile.current}
  <Print resume={profile.current} />
{/if}

<style>
  .container {
    @media print {
      display: none;
    }
  }

  .editor-container {
    margin-bottom: var(--space-8);
  }

  .save-message {
    text-align: center;
    margin-bottom: var(--space-4);
  }

  .recommendations-section {
    display: grid;
    gap: var(--space-8);
  }

  .recommendation {
    padding: var(--space-6) 0;
  }
</style>
