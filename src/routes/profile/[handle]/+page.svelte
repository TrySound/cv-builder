<script lang="ts">
  import { page } from "$app/state";
  import type { Resume } from "$lib/resume-schema";
  import Topbar from "$lib/topbar.svelte";
  import UploadResumeDialog from "$lib/upload-resume-dialog.svelte";
  import Editor from "../../../editor.svelte";
  import Print from "../../../print.svelte";

  let { data, form } = $props();

  // svelte-ignore state_referenced_locally
  let resume = $state<Resume>(data.resume);
  let saveMessage = $state("");
  let recommendationText = $state("");

  // Track which recommendation is currently targeted via URL hash
  let targetedId = $derived(page.url.hash.slice(1));

  async function handleSave() {
    if (!data.isOwnProfile) return;

    saveMessage = "";

    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume }),
      });

      if (!response.ok) {
        const error = await response.json();
        saveMessage = error.error || "Failed to save profile";
      }
    } catch (e) {
      saveMessage = "Failed to save profile";
    }
  }

  function handleResumeUpload(uploadedResume: Resume) {
    resume = uploadedResume;
    handleSave();
  }
</script>

<div class="container">
  <Topbar handle={data.handle} />

  <div class="actions">
    {#if data.isOwnProfile}
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

  <Editor bind:resume onSave={handleSave} readonly={!data.isOwnProfile} />

  <!-- Recommendations Section -->
  <section
    class="recommendations-section"
    aria-label="Recommendations from other members"
  >
    <h2 class="heading-2 subtle">Recommendations</h2>
    <!-- Write Recommendation Form -->
    {#if !data.isOwnProfile && !data.hasRecommended}
      <form method="POST" action="?/recommend" class="form-stack">
        {#if form?.error}
          <div class="alert alert-error">{form.error}</div>
        {/if}
        {#if form?.success}
          <div class="alert alert-success">
            Recommendation posted successfully!
          </div>
        {:else}
          <div class="form-group">
            <label for="recommendation-input" class="form-label">
              Write a recommendation
              <span class="character-count">
                {recommendationText.length} / 200 characters
              </span>
            </label>
            <textarea
              id="recommendation-input"
              name="text"
              bind:value={recommendationText}
              placeholder="Write your recommendation here..."
              rows="6"
              class="form-input"
              required
              minlength="200"
            ></textarea>
          </div>
          <div>
            <button class="button">Post</button>
          </div>
        {/if}
      </form>
    {/if}

    {#if data.recommendations.length > 0}
      <div class="recommendations-list">
        {#each data.recommendations as item}
          <article
            id="recommendation-{item.id}"
            class="recommendation-item"
            class:highlight={targetedId === `recommendation-${item.id}`}
          >
            <div class="subtle">
              {#if item.isFromInvite}
                Invited by
              {:else}
                Recommended by
              {/if}
              <a href="/profile/{item.authorHandle}" class="link">
                {item.authorName || item.authorHandle}
              </a>
              <time datetime={item.createdAt}>
                {new Date(item.createdAt ?? 0).toLocaleDateString()}
              </time>
            </div>
            <div class="quote">
              <p>{item.text}</p>
            </div>
          </article>
        {/each}
      </div>
    {:else}
      <p class="subtle">The member has not been recommended yet</p>
    {/if}
  </section>
</div>

<UploadResumeDialog onUpload={handleResumeUpload} />

<Print {resume} />

<style>
  .container {
    @media print {
      display: none;
    }
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

  .recommendations-list {
    display: grid;
    gap: var(--space-6);
  }

  .recommendation-item {
    display: grid;
    gap: var(--space-4);
  }

  .recommendation-item.highlight {
    background-color: var(--color-bg-hover);
    padding: var(--space-4);
    margin: calc(-1 * var(--space-4));
    border-radius: var(--radius-md);
    transition: background-color 0.3s ease;
  }
</style>
