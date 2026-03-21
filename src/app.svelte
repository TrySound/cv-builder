<script lang="ts">
  import { parseResume, createEmptyResume, type Resume } from "./cv-parser";
  import { saveToStorage, loadFromStorage } from "./storage";
  import Preview from "./preview.svelte";
  import Editor from "./editor.svelte";

  let resume = $state<Resume>(loadFromStorage());
  let viewMode = $state<"editor" | "preview">("editor");
  let autofillText = $state("");

  // Auto-save resume changes to localStorage
  $effect(() => {
    saveToStorage(resume);
  });

  function toggleView() {
    viewMode = viewMode === "editor" ? "preview" : "editor";
  }

  function handleExtract() {
    if (!autofillText.trim()) {
      return;
    }
    resume = parseResume(autofillText);
    console.log(resume);
    autofillText = "";
    // Dialog will auto-close due to method=dialog on the form
  }
</script>

<main class="container">
  <header class="app-header">
    <h1 class="app-title">CV Builder</h1>
    <div class="flex gap-3">
      <button
        type="button"
        class="btn btn--secondary"
        commandfor="app-autofill-dialog"
        command="show-modal"
      >
        Autofill
      </button>
      <button
        type="button"
        class="btn btn--secondary"
        onclick={() => window.print()}
      >
        Print
      </button>
      <button type="button" class="btn btn--primary" onclick={toggleView}>
        {viewMode === "editor" ? "Preview" : "Edit"}
      </button>
    </div>
  </header>

  <div class="editor-container" hidden={viewMode !== "editor"}>
    <Editor bind:resume />
  </div>
  <div class="preview-container" hidden={viewMode !== "preview"}>
    <Preview {resume} />
  </div>
</main>

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
      <button type="submit" class="btn btn--primary"> Extract </button>
    </div>
  </form>
</dialog>

<style>
  .app-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-5);
  }

  .app-title {
    color: var(--color-primary);
    margin: 0;
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
  }

  .autofill-input {
    field-sizing: fixed;
  }

  @media (max-width: 640px) {
    .app-header {
      flex-direction: column;
      gap: var(--space-4);
      align-items: flex-start;
    }

    .app-header .flex {
      width: 100%;
    }

    .app-header .btn {
      flex: 1;
    }
  }

  @media print {
    @page {
      size: A4;
    }

    .container {
      padding: 0;
      max-width: none;
    }

    .app-header {
      display: none;
    }

    .editor-container {
      display: none;
    }

    .preview-container {
      display: block;
    }
  }
</style>
