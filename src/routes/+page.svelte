<script lang="ts">
  import { parseResume, type Resume } from "$lib/cv-parser";
  import { saveToStorage, loadFromStorage } from "$lib/storage";
  import Topbar from "$lib/topbar.svelte";
  import Print from "../print.svelte";
  import Editor from "../editor.svelte";

  let { data } = $props();

  let resume = $state<Resume>(loadFromStorage());
  let autofillText = $state("");

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
  <Topbar handle={data.handle} />

  <div class="page-actions">
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

  <Editor bind:resume onSave={() => saveToStorage(resume)} />
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
  .page-actions {
    display: flex;
    gap: var(--space-2);
    justify-content: end;
    align-items: center;
    padding-left: calc(180px + var(--space-8));
    margin-bottom: var(--space-4);
  }

  .autofill-input {
    field-sizing: fixed;
  }

  @media (max-width: 640px) {
    .page-actions {
      padding-left: 0;
    }
  }

  @media print {
    .container {
      display: none;
    }
  }
</style>
