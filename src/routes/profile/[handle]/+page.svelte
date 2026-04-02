<script lang="ts">
  import { page } from "$app/state";
  import { parseResume } from "$lib/cv-parser";
  import type { Resume } from "$lib/resume-schema";
  import Topbar from "$lib/topbar.svelte";
  import Editor from "../../../editor.svelte";
  import Print from "../../../print.svelte";

  let { data, form } = $props();

  let resume = $state<Resume>(data.resume);
  let isSaving = $state(false);
  let saveMessage = $state("");
  let recommendationText = $state("");

  // Track which recommendation is currently targeted via URL hash
  let targetedId = $derived(page.url.hash.slice(1));

  // File upload state
  let selectedFile = $state<File | null>(null);
  let uploadError = $state("");
  let isUploading = $state(false);
  let isDragOver = $state(false);

  const resetUploadDialog = () => {
    selectedFile = null;
    uploadError = "";
    isUploading = false;
    isDragOver = false;
  };

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

  function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      selectedFile = input.files[0];
      uploadError = "";
      // Automatically trigger upload and parsing
      handleFileUpload();
    }
  }

  function handleFileUpload() {
    if (!selectedFile) {
      uploadError = "Please select a PDF file";
      return;
    }

    // Validate file type
    if (selectedFile.type !== "application/pdf") {
      uploadError = "Only PDF files are accepted";
      return;
    }

    // Validate file size (500kB)
    if (selectedFile.size > 500 * 1024) {
      uploadError = "PDF must be under 500kB";
      return;
    }

    uploadError = "";
    isUploading = true;

    const formData = new FormData();
    formData.append("file", selectedFile);

    fetch("/api/parse-pdf", {
      method: "POST",
      body: formData,
    })
      .then(async (response) => {
        const result = await response.json();
        isUploading = false;

        if (!response.ok) {
          uploadError = result.error || "Failed to parse resume";
          return;
        }

        if (result.resume) {
          resume = result.resume;
          selectedFile = null;
          handleSave();
          // Close dialog
          const dialog = document.getElementById(
            "app-autofill-dialog",
          ) as HTMLDialogElement;
          dialog?.close();
        }
      })
      .catch((error) => {
        uploadError =
          error instanceof Error
            ? error.message
            : "Network error. Please try again.";
        isUploading = false;
      });
  }

  function handleDragEnter(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    isDragOver = true;
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    isDragOver = true;
  }

  function handleDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    // Only set isDragOver to false if we're actually leaving the element (not entering a child)
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = event.clientX;
    const y = event.clientY;
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      isDragOver = false;
    }
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files[0]) {
      selectedFile = files[0];
      uploadError = "";
      // Automatically trigger upload and parsing
      handleFileUpload();
    }
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
        commandfor="app-autofill-dialog"
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

<dialog
  id="app-autofill-dialog"
  closedby="any"
  class="dialog"
  ontoggle={resetUploadDialog}
>
  <header class="dialog-header">
    <h2 class="dialog-title">Upload Resume</h2>
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

  <div class="dialog-content">
    {#if uploadError}
      <div class="alert alert-error">{uploadError}</div>
    {/if}

    <p class="dialog-description">
      Upload your resume PDF (max 500kB) to automatically extract your
      information
    </p>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="drop-zone"
      class:drag-over={isDragOver}
      ondragenter={handleDragEnter}
      ondragover={handleDragOver}
      ondragleave={handleDragLeave}
      ondrop={handleDrop}
    >
      <input
        type="file"
        accept=".pdf"
        onchange={handleFileSelect}
        class="file-input"
        id="resume-file"
        disabled={isUploading}
      />
      {#if isUploading}
        <div class="upload-loader">
          <div class="spinner"></div>
          <span>Parsing your resume...</span>
        </div>
      {:else}
        <label for="resume-file" class="file-label">
          <svg width="48" height="48">
            <use href="#icon-upload" />
          </svg>
          <span>
            {selectedFile
              ? selectedFile.name
              : "Drop your PDF here or click to browse"}
          </span>
          <span class="subtle">Maximum file size: 500KB</span>
        </label>
      {/if}
    </div>
  </div>
</dialog>

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

  .upload-loader {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-4);
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--color-border);
    border-top-color: var(--color-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .upload-loader span {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }

  .drop-zone {
    position: relative;
    height: 240px;
    display: flex;
    justify-content: center;
    align-items: center;
    border: 2px dashed var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-text-secondary);
    transition: all var(--transition-fast);
  }

  .drop-zone.drag-over {
    border-color: var(--color-primary);
  }

  .drop-zone:hover,
  .drop-zone.drag-over {
    background: var(--color-bg-hover);
    color: var(--color-text);
  }

  .file-input {
    position: absolute;
    inset: 0;
    opacity: 0;
    width: 100%;
    height: 100%;
  }

  .file-label {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-3);
    padding: var(--space-2);
    text-align: center;
    pointer-events: none;
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
