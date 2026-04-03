<script lang="ts">
  import type { Resume } from "$lib/resume-schema";

  let {
    onUpload,
  }: {
    onUpload: (resume: Resume) => void;
  } = $props();

  // File upload state
  let selectedFile = $state<File | null>(null);
  let uploadError = $state("");
  let isUploading = $state(false);
  let isDragOver = $state(false);
  let dialog: undefined | HTMLDialogElement;

  // Polling state
  let jobId = $state<string | null>(null);
  let pollInterval: ReturnType<typeof setInterval> | null = null;
  let pollingAttempts = $state(0);
  const MAX_POLLING_ATTEMPTS = 150; // 5 minutes at 2 second intervals

  function reset() {
    selectedFile = null;
    uploadError = "";
    isUploading = false;
    isDragOver = false;
    jobId = null;
    pollingAttempts = 0;
    stopPolling();
  }

  function stopPolling() {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  }

  async function pollForResult(currentJobId: string) {
    try {
      const response = await fetch(`/api/parse-pdf-status?id=${currentJobId}`);
      const result = await response.json();

      if (!response.ok) {
        uploadError = result.error || "Failed to check parsing status";
        stopPolling();
        isUploading = false;
        return;
      }

      if (result.status === "completed" && result.resume) {
        stopPolling();
        isUploading = false;
        onUpload(result.resume);
        selectedFile = null;
        dialog?.close();
      } else if (result.status === "failed") {
        stopPolling();
        isUploading = false;
        uploadError = result.error || "Failed to parse resume";
      } else {
        // Still processing - increment attempts
        pollingAttempts++;
        if (pollingAttempts >= MAX_POLLING_ATTEMPTS) {
          stopPolling();
          isUploading = false;
          uploadError = "PDF parsing timed out. Please try again later.";
        }
      }
    } catch (error) {
      stopPolling();
      isUploading = false;
      uploadError =
        error instanceof Error
          ? error.message
          : "Network error during status check. Please try again.";
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
    jobId = null;
    pollingAttempts = 0;

    const formData = new FormData();
    formData.append("file", selectedFile);

    fetch("/api/parse-pdf", {
      method: "POST",
      body: formData,
    })
      .then(async (response) => {
        const result = await response.json();

        if (!response.ok) {
          isUploading = false;
          uploadError = result.error || "Failed to start resume parsing";
          return;
        }

        if (result.jobId) {
          jobId = result.jobId;
          // Start polling for results
          pollInterval = setInterval(() => {
            if (jobId) {
              pollForResult(jobId);
            }
          }, 2000); // Poll every 2 seconds

          // Do an immediate first poll
          pollForResult(result.jobId);
        } else {
          isUploading = false;
          uploadError = "No job ID received from server";
        }
      })
      .catch((error) => {
        isUploading = false;
        uploadError =
          error instanceof Error
            ? error.message
            : "Network error. Please try again.";
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

<dialog
  bind:this={dialog}
  id="upload-resume-dialog"
  closedby="any"
  class="dialog"
  ontoggle={reset}
>
  <header class="dialog-header">
    <h2 class="dialog-title">Upload Resume</h2>
    <button
      class="icon-button"
      aria-label="Close"
      commandfor="upload-resume-dialog"
      command="close"
      disabled={isUploading}
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
        id="upload-resume-dialog-file"
        disabled={isUploading}
      />
      {#if isUploading}
        <div class="upload-loader">
          <div class="spinner"></div>
          <span>Parsing your resume...</span>
          {#if jobId}
            <span class="subtle">This may take up to a minute</span>
          {/if}
        </div>
      {:else}
        <label for="upload-resume-dialog-file" class="file-label">
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

<style>
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
</style>
