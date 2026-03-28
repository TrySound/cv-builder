<script lang="ts">
  import { parseResume, type Resume } from "$lib/cv-parser";
  import Topbar from "$lib/topbar.svelte";
  import Editor from "../../../editor.svelte";
  import Print from "../../../print.svelte";

  let { data } = $props();

  let resume = $state<Resume>(data.resume);
  let isSaving = $state(false);
  let saveMessage = $state("");
  let autofillText = $state("");

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

  {#if saveMessage}
    <div
      class="save-message alert"
      class:alert-success={!saveMessage.includes("Failed")}
      class:alert-error={saveMessage.includes("Failed")}
    >
      {saveMessage}
    </div>
  {/if}

  <Editor bind:resume onSave={handleSave} />

  <!-- Recommendations Section -->
  {#if data.inviter || data.recommendations.length > 0}
    <div class="recommendations-section">
      <h2 class="heading-2">Recommendations from other members</h2>

      {#if data.recommendations.length > 0}
        <div class="recommendations-list">
          {#each data.recommendations as rec}
            <div
              class="card-lg recommendation-card"
              class:from-invite={rec.isFromInvite}
            >
              <div class="recommendation-header">
                <a href="/profile/{rec.authorHandle}" class="author-link">
                  {rec.authorName || rec.authorHandle}
                </a>
                {#if rec.isFromInvite}
                  <span class="badge badge-primary">Invitation</span>
                {/if}
              </div>
              <p class="recommendation-text">{rec.text}</p>
              <time class="recommendation-date" datetime={rec.createdAt}>
                {new Date(rec.createdAt ?? 0).toLocaleDateString()}
              </time>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>

<dialog id="app-autofill-dialog" closedby="any" class="dialog">
  <form method="dialog" class="dialog-content" onsubmit={handleExtract}>
    <h2 class="dialog-title">Autofill from Resume Text</h2>
    <p class="dialog-description">
      Paste your resume text below to extract and populate the editor
    </p>
    <textarea
      bind:value={autofillText}
      placeholder="Paste your resume text here..."
      rows="15"
      class="form-input autofill-input"
    ></textarea>
    <div class="flex justify-end">
      <button type="submit" class="button">Extract</button>
    </div>
  </form>
</dialog>

<Print {resume} />

<style>
  .autofill-input {
    field-sizing: fixed;
  }

  .save-message {
    text-align: center;
    margin-bottom: var(--space-4);
  }

  @media print {
    .container {
      display: none;
    }
  }

  .recommendations-section {
    display: grid;
    gap: var(--space-8);
    margin-top: var(--space-8);
    padding: var(--space-8) 0;
    border-top: 2px solid var(--color-border);
  }

  .inviter-info {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-bottom: var(--space-6);
    background: var(--color-info-bg, #dbeafe);
  }

  .inviter-link {
    color: var(--color-primary);
    font-weight: var(--font-weight-medium);
  }

  .recommendations-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .recommendation-card {
    padding: var(--space-5);
  }

  .recommendation-card.from-invite {
    border-left: 4px solid var(--color-primary);
  }

  .recommendation-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-3);
  }

  .author-link {
    color: var(--color-text);
    font-weight: var(--font-weight-semibold);
    text-decoration: none;
  }

  .author-link:hover {
    color: var(--color-primary);
  }

  .recommendation-text {
    line-height: var(--line-height-relaxed);
    margin-bottom: var(--space-3);
    color: var(--color-text);
  }

  .recommendation-date {
    font-size: var(--font-size-sm);
    color: var(--color-text-tertiary);
  }
</style>
