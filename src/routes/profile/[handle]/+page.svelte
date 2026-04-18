<script lang="ts">
  import { page } from "$app/state";
  import type { Resume } from "$lib/jsonresume";
  import Topbar from "$lib/topbar.svelte";
  import UploadResumeDialog from "$lib/upload-resume-dialog.svelte";
  import Editor from "../../../editor.svelte";
  import Print from "../../../print.svelte";
  import {
    getProfileRecommendations,
    createRecommendation as createRecommendationRaw,
  } from "$lib/recommendation.remote";
  import { getMemberProfile, updateMemberProfile } from "$lib/profile.remote";
  import { formatDate } from "$lib/date";

  let { data } = $props();

  const mode = $derived(
    page.url.searchParams.get("mode") === "cv" ? "cv" : "recommendation",
  );
  const isOwnProfile = $derived(data.handle === data.profile.handle);

  // reset the form instantly hidden after submission
  const createRecommendation = $derived(
    createRecommendationRaw.for(data.profile.handle),
  );

  // Load resume via remote query
  const profile = $derived(getMemberProfile({ handle: data.profile.handle }));

  // Load recommendations via remote query
  const recommendations = $derived(
    // await triggers reactivity loss warning but does not blink on the page
    await getProfileRecommendations({ handle: data.profile.handle }),
  );

  // Track which recommendation is currently targeted via URL hash
  const targetedId = $derived(page.url.hash.slice(1));

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
        fullResume={mode === "cv"}
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

    <!-- Write Recommendation Form -->
    {#if !isOwnProfile && !recommendations.isRecommendedByMe && data.handle}
      <div class="row">
        <div><!-- skip column --></div>
        <form {...createRecommendation} class="form-stack">
          <input
            {...createRecommendation.fields.handle.as(
              "hidden",
              data.profile.handle,
            )}
          />
          <div class="form-group">
            <label for="recommendation-input" class="form-label">
              Write a recommendation
              <span class="character-count">
                {createRecommendation.fields.reason.value()?.length ?? 0} / 200 characters
              </span>
            </label>
            <textarea
              id="recommendation-input"
              rows="6"
              class="form-input"
              placeholder="Write your recommendation here..."
              minlength="200"
              {...createRecommendation.fields.reason.as("text")}
            ></textarea>
          </div>
          <div>
            <button
              class="button"
              data-state={createRecommendation.pending ? "loading" : "idle"}
            >
              Post
            </button>
          </div>
        </form>
      </div>
    {/if}

    <div>
      {#each recommendations.recommendations as item}
        <article
          id="recommendation-{item.id}"
          class="row recommendation"
          class:active={targetedId === `recommendation-${item.id}`}
        >
          <div>
            <time class="subtle" datetime={item.createdAt}>
              {formatDate(item.createdAt)}
            </time>
          </div>
          <div class="margin-trim-block">
            <p>
              <a href="/profile/{item.authorHandle}" class="link">
                {item.authorHandle}
              </a>
            </p>
            <p>
              {item.reason}
            </p>
          </div>
        </article>
      {:else}
        <div class="row">
          <div><!-- skip column --></div>
          <p class="subtle">The user has not been recommended yet</p>
        </div>
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

  .character-count {
    float: right;
  }

  .recommendation {
    padding: var(--space-6) var(--space-4);
    margin: 0 calc(var(--space-4) * -1);
    &.active {
      background-color: var(--color-bg-hover);
    }
  }
</style>
