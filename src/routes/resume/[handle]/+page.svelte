<script lang="ts">
  import type { Resume } from "$lib/jsonresume";
  import Topbar from "$lib/topbar.svelte";
  import UploadResumeDialog from "$lib/upload-resume-dialog.svelte";
  import { getProfileRecommendations } from "$lib/recommendation.remote";
  import { getMemberProfile, updateMemberProfile } from "$lib/profile.remote";
  import { formatDate } from "$lib/date";
  import Editor from "../../../editor.svelte";
  import Print from "../../../print.svelte";

  let { data } = $props();

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
