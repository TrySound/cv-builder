<script lang="ts">
  import { parseResume, type Resume } from "$lib/cv-parser";
  import Topbar from "$lib/topbar.svelte";
  import Editor from "../../../editor.svelte";
  import Print from "../../../print.svelte";

  let { data } = $props<{
    data: {
      handle: string;
      resume: Resume;
      isOwnProfile: boolean;
    };
  }>();

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

  <div class="profile-actions">
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
      class="save-message"
      class:success={!saveMessage.includes("Failed")}
      class:error={saveMessage.includes("Failed")}
    >
      {saveMessage}
    </div>
  {/if}

  <Editor bind:resume onSave={handleSave} />
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
  .profile-actions {
    display: flex;
    align-items: center;
    justify-content: end;
    gap: var(--space-2);
    margin-bottom: var(--space-6);
  }

  .autofill-input {
    field-sizing: fixed;
  }

  .save-message {
    padding: var(--space-3);
    border-radius: var(--radius-md);
    margin-bottom: var(--space-4);
    text-align: center;
  }

  .save-message.success {
    background: var(--color-success-bg, #dcfce7);
    color: var(--color-success, #166534);
  }

  .save-message.error {
    background: var(--color-danger-bg, #fee2e2);
    color: var(--color-danger, #991b1b);
  }

  @media print {
    .container {
      display: none;
    }
  }
</style>
