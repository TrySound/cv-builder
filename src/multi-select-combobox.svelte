<script lang="ts">
  let {
    options,
    selected = $bindable(),
    label,
    placeholder = "Search or add...",
    id = "combobox",
  }: {
    options: string[];
    selected: string[];
    label: string;
    placeholder?: string;
    id?: string;
  } = $props();

  let inputValue = $state("");
  let isOpen = $state(false);
  let activeIndex = $state(-1);
  let listboxId = $derived(`${id}-listbox`);
  let inputRef: HTMLInputElement | undefined;
  let listElement: HTMLElement | undefined = $state(undefined);

  // Flatten all options and remove duplicates
  const allOptions = $derived(
    [...new Set([...options, ...selected])].sort((a, b) =>
      a.toLowerCase().localeCompare(b.toLowerCase()),
    ),
  );

  // Filter options based on input
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
      selected.push(trimmed);
    }
    inputValue = "";
    isOpen = false;
    activeIndex = -1;
    inputRef?.focus();
  }

  function removeOption(option: string) {
    const index = selected.findIndex(
      (s) => s.toLowerCase() === option.toLowerCase(),
    );
    if (index !== -1) {
      selected.splice(index, 1);
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (!isOpen) {
      if (
        event.key === "ArrowDown" ||
        event.key === "Enter" ||
        event.key === " "
      ) {
        isOpen = true;
        event.preventDefault();
        return;
      }
    }

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        activeIndex = Math.min(activeIndex + 1, filteredOptions.length - 1);
        break;
      case "ArrowUp":
        event.preventDefault();
        activeIndex = Math.max(activeIndex - 1, -1);
        break;
      case "Enter":
        event.preventDefault();
        if (activeIndex >= 0 && activeIndex < filteredOptions.length) {
          addOption(filteredOptions[activeIndex]);
        } else if (inputValue.trim()) {
          addOption(inputValue);
        }
        break;
      case "Escape":
        isOpen = false;
        activeIndex = -1;
        break;
      case "Backspace":
        if (!inputValue && selected.length > 0) {
          removeOption(selected[selected.length - 1]);
        }
        break;
    }
  }

  function handleInputFocus() {
    isOpen = true;
  }

  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest(`.combobox-wrapper-${id}`)) {
      isOpen = false;
      activeIndex = -1;
    }
  }

  // Close on click outside
  $effect(() => {
    if (isOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  });

  // scroll while navigating with keyboard
  $effect(() => {
    if (listElement) {
      listElement.children.item(activeIndex)?.scrollIntoView({
        block: "nearest",
      });
    }
  });

  // Announce to screen readers
  let announcement = $state("");
  $effect(() => {
    if (isOpen) {
      announcement = `${filteredOptions.length} options available`;
    }
  });
</script>

<div class={`combobox-wrapper-${id} combobox`}>
  <label for={id} class="form-label">{label}</label>

  <!-- Selected option chips -->
  <div class="selected-chips">
    {#each selected as option}
      <span class="chip chip--removable" role="listitem">
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

  <!-- Input and dropdown -->
  <div style="position: relative;">
    <input
      bind:this={inputRef}
      {id}
      class="form-input"
      type="text"
      role="combobox"
      aria-expanded={isOpen}
      aria-autocomplete="list"
      aria-controls={listboxId}
      aria-activedescendant={activeIndex >= 0
        ? `${id}-option-${activeIndex}`
        : undefined}
      aria-haspopup="listbox"
      bind:value={inputValue}
      onkeydown={handleKeydown}
      onfocus={handleInputFocus}
      {placeholder}
      autocomplete="off"
    />

    {#if isOpen}
      <ul
        bind:this={listElement}
        {id}
        role="listbox"
        aria-label="Options"
        class="combobox-list"
      >
        {#each filteredOptions as option, index}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <li
            id={`${id}-option-${index}`}
            role="option"
            aria-selected={index === activeIndex}
            class="combobox-option"
            class:combobox-option--active={index === activeIndex}
            onclick={() => addOption(option)}
            onmouseenter={() => (activeIndex = index)}
          >
            {option}
          </li>
        {/each}
        {#if inputValue.trim() && !filteredOptions.some((opt) => opt.toLowerCase() === inputValue.toLowerCase()) && !selected.some((s) => s.toLowerCase() === inputValue.toLowerCase())}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <li
            id={`${id}-option-custom`}
            role="option"
            aria-selected={activeIndex === filteredOptions.length}
            class="combobox-option custom-option"
            class:combobox-option--active={activeIndex ===
              filteredOptions.length}
            onclick={() => addOption(inputValue)}
            onmouseenter={() => (activeIndex = filteredOptions.length)}
          >
            Add "{inputValue}"...
          </li>
        {/if}
        {#if filteredOptions.length === 0 && !inputValue.trim()}
          <li class="combobox-empty">No more options available</li>
        {/if}
      </ul>
    {/if}
  </div>

  <!-- Screen reader announcement -->
  <div class="sr-only" aria-live="polite" aria-atomic="true">
    {announcement}
  </div>
</div>

<style>
  .combobox {
    position: relative;
  }

  .combobox-list {
    position: absolute;
    bottom: 100%;
    left: 0;
    right: 0;
    margin-top: var(--space-1);
    padding: 0;
    list-style: none;
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border-input);
    border-radius: var(--radius-md);
    max-height: 300px;
    overflow-y: auto;
    z-index: var(--z-dropdown);
    box-shadow: var(--shadow-md);
  }

  .combobox-option {
    padding: var(--space-2) var(--space-3);
    cursor: pointer;
    font-size: var(--font-size-base);
    color: var(--color-text-secondary);
    transition: background-color var(--transition-fast);
  }

  .combobox-option:hover,
  .combobox-option--active {
    background-color: var(--color-primary-light);
    color: var(--color-primary);
  }

  .combobox-empty {
    padding: var(--space-3);
    text-align: center;
    color: var(--color-text-placeholder);
    font-size: var(--font-size-sm);
  }

  .selected-chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin-bottom: var(--space-2);
    min-height: 2rem;
  }

  .custom-option {
    font-style: italic;
    color: var(--color-text-muted);
    border-top: 1px solid var(--color-border);
  }
</style>
