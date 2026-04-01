<script lang="ts">
  import { parseResume, type Resume } from "$lib/cv-parser";
  import { saveToStorage, loadFromStorage } from "$lib/storage";
  import Topbar from "$lib/topbar.svelte";
  import Print from "../../print.svelte";
  import Editor from "../../editor.svelte";

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

  <div class="actions">
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

  <div style="height: var(--space-4)"></div>

  <Editor bind:resume onSave={() => saveToStorage(resume)} />
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
  .autofill-input {
    field-sizing: fixed;
  }

  @media print {
    .container {
      display: none;
    }
  }
</style>
