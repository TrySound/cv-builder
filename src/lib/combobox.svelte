<script lang="ts" generics="T extends string | { value: string }">
  import type { Snippet } from "svelte";

  let {
    id,
    value = $bindable(),
    options,
    placeholder = "Search...",
    allowCustom = false,
    stayOpenOnSelect = false,
    loading = false,
    onselect,
    onkeydown,
    onfocus,
    onblur,
    oninput,
    optionSnippet,
  }: {
    id: string;
    value: string;
    options: T[];
    placeholder?: string;
    allowCustom?: boolean;
    stayOpenOnSelect?: boolean;
    loading?: boolean;
    onselect?: (option: T) => void;
    onkeydown?: (event: KeyboardEvent) => void;
    onfocus?: () => void;
    onblur?: () => void;
    oninput?: (value: string) => void;
    optionSnippet?: Snippet<[T]>;
  } = $props();

  let isOpen = $state(false);
  let activeIndex = $state(-1);
  let listboxId = $derived(`${id}-listbox`);
  let listElement: HTMLElement | undefined = $state(undefined);

  function getOptionValue(option: T): string {
    if (typeof option === "string") {
      return option;
    }
    return option.value;
  }

  function selectOption(option: T) {
    onselect?.(option);
    if (!stayOpenOnSelect) {
      isOpen = false;
    }
    activeIndex = -1;
  }

  function handleKeydown(event: KeyboardEvent) {
    // Let parent handle first (for Backspace to remove chips, etc.)
    onkeydown?.(event);
    if (event.defaultPrevented) return;

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
        activeIndex = Math.min(activeIndex + 1, options.length - 1);
        if (
          allowCustom &&
          value.trim() &&
          !options.some(
            (opt) => getOptionValue(opt).toLowerCase() === value.toLowerCase(),
          )
        ) {
          activeIndex = Math.min(activeIndex + 1, options.length);
        }
        break;
      case "ArrowUp":
        event.preventDefault();
        activeIndex = Math.max(activeIndex - 1, -1);
        break;
      case "Enter":
        event.preventDefault();
        if (activeIndex >= 0 && activeIndex < options.length) {
          selectOption(options[activeIndex]);
        } else if (
          allowCustom &&
          value.trim() &&
          activeIndex === options.length
        ) {
          selectOption(value.trim() as T);
        } else if (value.trim() && options.length === 1) {
          selectOption(options[0]);
        }
        break;
      case "Escape":
        isOpen = false;
        activeIndex = -1;
        break;
    }
  }

  function handleInput(event: Event) {
    isOpen = true;
    const newValue = (event.target as HTMLInputElement).value;
    oninput?.(newValue);
  }

  function handleInputFocus() {
    isOpen = true;
    onfocus?.();
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
      const customOptionCount =
        allowCustom &&
        value.trim() &&
        !options.some(
          (opt) => getOptionValue(opt).toLowerCase() === value.toLowerCase(),
        )
          ? 1
          : 0;
      announcement = `${options.length + customOptionCount} options available`;
    }
  });
</script>

<div class={`combobox-wrapper-${id} combobox`}>
  <div
    class="combobox-input-wrapper form-input-wrapper"
    data-state={loading ? "loading" : undefined}
  >
    <input
      {id}
      class="form-input"
      type="text"
      {placeholder}
      autocomplete="off"
      data-state={loading ? "loading" : undefined}
      role="combobox"
      aria-expanded={isOpen}
      aria-autocomplete="list"
      aria-controls={listboxId}
      aria-activedescendant={activeIndex >= 0
        ? `${id}-option-${activeIndex}`
        : undefined}
      aria-haspopup="listbox"
      bind:value
      oninput={handleInput}
      onkeydown={handleKeydown}
      onfocusin={handleInputFocus}
      onfocusout={onblur}
    />

    {#if isOpen}
      <ul
        bind:this={listElement}
        id={listboxId}
        role="listbox"
        aria-label="Options"
        class="menu"
      >
        {#each options as option, index}
          {@const optionValue = getOptionValue(option)}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <li
            id={`${id}-option-${index}`}
            role="option"
            aria-selected={index === activeIndex}
            class="menuitem"
            onclick={() => selectOption(option)}
            onmouseenter={() => (activeIndex = index)}
          >
            {#if optionSnippet}
              {@render optionSnippet(option)}
            {:else}
              {optionValue}
            {/if}
          </li>
        {/each}
        {#if allowCustom && value.trim() && !options.some((opt) => getOptionValue(opt).toLowerCase() === value.toLowerCase())}
          {@const customIndex = options.length}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <li
            id={`${id}-option-${customIndex}`}
            role="option"
            aria-selected={customIndex === activeIndex}
            class="menuitem custom-option"
            onclick={() => selectOption(value.trim() as T)}
            onmouseenter={() => (activeIndex = customIndex)}
          >
            Add "{value}"...
          </li>
        {/if}
        {#if options.length === 0 && value.trim() && !loading}
          <li class="combobox-empty">No options available</li>
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
    width: 100%;
  }

  .combobox-input-wrapper {
    position: relative;
    width: 100%;
  }

  .menu {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin: var(--space-1) 0 0;
    list-style: none;
    max-height: 300px;
    overflow-y: auto;
    z-index: var(--z-dropdown);
  }

  .menu:not(:has(> *)) {
    display: none;
  }

  .combobox-empty {
    padding: var(--space-3);
    text-align: center;
    color: var(--color-text-placeholder);
    font-size: var(--font-size-sm);
  }

  .custom-option {
    font-style: italic;
    color: var(--color-text-muted);
  }
</style>
