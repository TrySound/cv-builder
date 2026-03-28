<script lang="ts">
  import { parseResume, type Resume } from "$lib/cv-parser";
  import Topbar from "$lib/topbar.svelte";
  import Editor from "../../../editor.svelte";
  import Print from "../../../print.svelte";

  let { data, form } = $props();

  let resume = $state<Resume>(data.resume);
  let isSaving = $state(false);
  let saveMessage = $state("");
  let autofillText = $state("");
  let recommendationText = $state("");
  let showRecommendationForm = $state(false);

  async function handleSave() {
    if (!data.isOwnProfile) return;

    isSaving = true;
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
    } finally {
      isSaving = false;
    }
  }

  function handleExtract() {
    if (!autofillText.trim()) {
      return;
    }
    resume = parseResume(autofillText);
    autofillText = "";
    handleSave();
    // Dialog will auto-close due to method=dialog on the form
  }

  function toggleRecommendationForm() {
    showRecommendationForm = !showRecommendationForm;
    if (!showRecommendationForm) {
      recommendationText = "";
    }
  }
</script>

<div class="container">
  <Topbar handle={data.handle} />

  <div class="actions">
    {#if data.isOwnProfile}
      <button
        type="button"
        class="button"
        commandfor="app-autofill-dialog"
        command="show-modal"
      >
        Autofill
      </button>
    {/if}
    <button type="button" class="button" onclick={() => window.print()}>
      Print
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
  {#if data.inviter || data.recommendations.length > 0 || (!data.isOwnProfile && !data.hasRecommended)}
    <section
      class="recommendations-section"
      aria-label="Recommendations from other members"
    >
      <!-- Write Recommendation Form -->
      {#if !data.isOwnProfile && !data.hasRecommended}
        {#if !showRecommendationForm}
          <button
            type="button"
            class="button button-secondary"
            onclick={toggleRecommendationForm}
          >
            Write a recommendation
          </button>
        {:else}
          <form
            method="POST"
            action="?/recommend"
            class="recommendation-form card-lg"
          >
            <h3 class="heading-3">Write a recommendation</h3>

            {#if form?.error}
              <div class="alert alert-error">{form.error}</div>
            {/if}

            {#if form?.success}
              <div class="alert alert-success">
                Recommendation submitted successfully!
              </div>
            {:else}
              <div class="form-group">
                <textarea
                  name="text"
                  bind:value={recommendationText}
                  placeholder="Write your recommendation here..."
                  rows="6"
                  class="form-input"
                  required
                  minlength="200"
                ></textarea>
                <div class="character-count">
                  {recommendationText.length} / 200 characters
                </div>
              </div>

              <div class="actions">
                <button
                  type="button"
                  class="button button-ghost"
                  onclick={toggleRecommendationForm}
                >
                  Cancel
                </button>
                <button type="submit" class="button button-primary">
                  Submit
                </button>
              </div>
            {/if}
          </form>
        {/if}
      {/if}

      {#if data.recommendations.length > 0}
        <div class="recommendations-list">
          {#each data.recommendations as item}
            <article>
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
              <p>{item.text}</p>
            </article>
          {/each}
        </div>
      {/if}
    </section>
  {/if}
</div>

<dialog id="app-autofill-dialog" closedby="any" class="dialog">
  <header class="dialog-header">
    <h2 class="dialog-title">Autofill from Resume Text</h2>
    <button
      class="icon-button"
      aria-label="Close"
      commandfor="app-autofill-dialog"
      command="close"
    >
      <svg width="20" height="20">
        <use href="#icon-x" />
      </svg>
    </button>
  </header>
  <form method="dialog" class="dialog-content" onsubmit={handleExtract}>
    <p class="dialog-description">
      Paste your resume text below to extract and populate the editor
    </p>
    <textarea
      bind:value={autofillText}
      placeholder="Paste your resume text here..."
      rows="15"
      class="form-input autofill-input"
    ></textarea>
    <div class="actions">
      <button type="submit" class="button">Extract</button>
    </div>
  </form>
</dialog>

<Print {resume} />

<style>
  .container {
    @media print {
      display: none;
    }
  }

  .autofill-input {
    field-sizing: fixed;
  }

  .save-message {
    text-align: center;
    margin-bottom: var(--space-4);
  }

  .recommendations-section {
    display: grid;
    gap: var(--space-8);
    margin-top: var(--space-8);
    padding: var(--space-8) 0;
    border-top: 2px solid var(--color-border);
  }

  .recommendations-list {
    display: grid;
    gap: var(--space-6);
  }

  .recommendation-form {
    padding: var(--space-5);
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .recommendation-form h3 {
    margin: 0;
  }

  .character-count {
    font-size: var(--font-size-sm);
    color: var(--color-text-tertiary);
    text-align: right;
  }
</style>
