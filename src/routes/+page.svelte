<script lang="ts">
  import { parseResume, type Resume } from "$lib/cv-parser";
  import { saveToStorage, loadFromStorage } from "$lib/storage";
  import Print from "../print.svelte";
  import Editor from "../editor.svelte";
  import "../app.css";

  let resume = $state<Resume>(loadFromStorage());
  let autofillText = $state("");

  // Auto-save resume changes to localStorage
  $effect(() => {
    saveToStorage(resume);
  });

  function handleExtract() {
    if (!autofillText.trim()) {
      return;
    }
    resume = parseResume(autofillText);
    autofillText = "";
    // Dialog will auto-close due to method=dialog on the form
  }
</script>

<div class="container">
  <header class="app-header">
    <h1 class="heading-1">CV Builder</h1>
    <div>
      <button
        type="button"
        class="button"
        commandfor="app-autofill-dialog"
        command="show-modal"
      >
        Autofill
      </button>
      <button type="button" class="button" onclick={() => window.print()}>
        Print
      </button>
    </div>
  </header>

  <Editor bind:resume />
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
  .app-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-left: calc(180px + var(--space-8));
    margin-bottom: var(--space-8);
  }

  .autofill-input {
    field-sizing: fixed;
  }

  @media (max-width: 640px) {
    .app-header {
      flex-direction: column;
      gap: var(--space-4);
      align-items: flex-start;
      padding-left: 0;
    }
  }

  @media print {
    .container {
      display: none;
    }
  }
</style>
