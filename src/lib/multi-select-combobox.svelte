<script lang="ts">
  import Combobox from "./combobox.svelte";

  let {
    options,
    selected = $bindable(),
    placeholder = "Search or add...",
    id = "combobox",
  }: {
    options: string[];
    selected: string[];
    placeholder?: string;
    id?: string;
  } = $props();

  let inputValue = $state("");

  // Flatten all options and remove duplicates
  const allOptions = $derived(
    [...new Set([...options, ...selected])].sort((a, b) =>
      a.toLowerCase().localeCompare(b.toLowerCase()),
    ),
  );

  // Filter options based on input (excluding already selected)
  const filteredOptions = $derived(
    inputValue.trim()
      ? allOptions.filter(
          (opt) =>
            opt.toLowerCase().includes(inputValue.toLowerCase()) &&
            !selected.some((s) => s.toLowerCase() === opt.toLowerCase()),
        )
      : allOptions.filter(
          (opt) => !selected.some((s) => s.toLowerCase() === opt.toLowerCase()),
        ),
  );

  function addOption(option: string) {
    const trimmed = option.trim();
    if (!trimmed) return;

    // Check if option already exists (case-insensitive)
    const exists = selected.some(
      (s) => s.toLowerCase() === trimmed.toLowerCase(),
    );
    if (!exists) {
      selected = selected.concat([trimmed]);
    }
    inputValue = "";
  }

  function removeOption(option: string) {
    const index = selected.findIndex(
      (s) => s.toLowerCase() === option.toLowerCase(),
    );
    if (index !== -1) {
      selected = selected.toSpliced(index, 1);
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Backspace" && !inputValue && selected.length > 0) {
      removeOption(selected[selected.length - 1]);
    }
  }
</script>

<div class="multi-select-combobox">
  <!-- Selected option chips -->
  <div class="selected-chips">
    {#each selected as option}
      <span class="chip" role="listitem">
        {option}
        <button
          type="button"
          class="chip-remove"
          onclick={() => removeOption(option)}
          aria-label={`Remove ${option}`}
        >
          ×
        </button>
      </span>
    {/each}
  </div>

  <!-- Combobox input -->
  <Combobox
    {id}
    bind:value={inputValue}
    options={filteredOptions}
    {placeholder}
    allowCustom={true}
    stayOpenOnSelect={true}
    onselect={addOption}
    onkeydown={handleKeydown}
  />
</div>

<style>
  .selected-chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin-bottom: var(--space-2);
    min-height: 2rem;
  }

  .selected-chips:empty {
    display: none;
  }

  .chip-remove {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.25rem;
    height: 1.25rem;
    background: transparent;
    border: none;
    color: inherit;
    cursor: pointer;
    font-size: 1rem;
    line-height: 1;
    padding: 0;
    margin-left: var(--space-1);
    border-radius: 50%;
    transition: background-color var(--transition-fast);
  }

  .chip-remove:hover {
    background: rgba(255, 255, 255, 0.2);
  }
</style>
