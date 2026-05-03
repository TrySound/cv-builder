<script lang="ts">
  import Combobox from "./combobox.svelte";

  interface Option {
    value: string;
    label: string;
  }

  let {
    options,
    selected = $bindable(),
    placeholder = "Search or add...",
    allowCustom = false,
    id = "combobox",
  }: {
    options: Option[];
    selected: Option[];
    placeholder?: string;
    allowCustom?: boolean;
    id?: string;
  } = $props();

  let inputValue = $state("");
  let newItemCounter = $state(0);

  // Flatten all options and remove duplicates (by value)
  const allOptions = $derived(
    [...new Set([...options, ...selected])].sort((a, b) =>
      a.label.toLowerCase().localeCompare(b.label.toLowerCase()),
    ),
  );

  // Filter options based on input (excluding already selected)
  const filteredOptions = $derived(
    inputValue.trim()
      ? allOptions.filter(
          (opt) =>
            opt.label.toLowerCase().includes(inputValue.toLowerCase()) &&
            !selected.some(
              (s) => s.label.toLowerCase() === opt.label.toLowerCase(),
            ),
        )
      : allOptions.filter(
          (opt) =>
            !selected.some(
              (s) => s.label.toLowerCase() === opt.label.toLowerCase(),
            ),
        ),
  );

  function addOption(option: Option) {
    // combobox gives string for custom options
    // @todo improve type safety
    if (typeof option === "string") {
      option = { value: option, label: option };
    }
    const trimmed = option.label.trim();
    if (!trimmed) {
      return;
    }

    // Check if option already exists (case-insensitive)
    const exists = selected.some(
      (s) => s.label.toLowerCase() === trimmed.toLowerCase(),
    );
    if (!exists) {
      newItemCounter += 1;
      selected = selected.concat([option]);
    }
    inputValue = "";
  }

  function removeOption(option: Option) {
    const index = selected.findIndex((s) => s.value === option.value);
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
  <div class="chip-group">
    {#each selected as option}
      <span class="chip" role="listitem">
        {option.label}
        <button
          type="button"
          class="chip-remove"
          onclick={() => removeOption(option)}
          aria-label={`Remove ${option.label}`}
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
    {allowCustom}
    stayOpenOnSelect={true}
    onselect={addOption}
    onkeydown={handleKeydown}
  >
    {#snippet optionSnippet(option)}
      {option.label}
    {/snippet}
  </Combobox>
</div>

<style>
  .chip-group {
    margin-bottom: var(--space-2);
    &:empty {
      display: none;
    }
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
