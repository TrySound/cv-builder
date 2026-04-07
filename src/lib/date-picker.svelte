<script lang="ts">
  let {
    value = $bindable(),
    placeholder = "Select date...",
    id = "date-combobox",
    minYear = 1970,
    maxYear = new Date().getFullYear(),
  }: {
    value?: string;
    placeholder?: string;
    id?: string;
    minYear?: number;
    maxYear?: number;
  } = $props();

  const MONTHS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  function parseDate(date: string): [number, undefined | number] {
    const [yearString, monthString] = date.split("-");
    const year = Number.parseInt(yearString, 10);
    if (!monthString) {
      return [year, undefined];
    }
    const month = Number.parseInt(monthString, 10);
    return [year, month];
  }

  const isValidDate = (date: undefined | string) => {
    if (!date) {
      return false;
    }
    const [year, month] = parseDate(date);
    return (
      minYear <= year &&
      year <= maxYear &&
      (month === undefined || (1 <= month && month <= 12))
    );
  };

  function formatDate(year: number, month?: number) {
    if (month) {
      return `${year}-${month.toString().padStart(2, "0")}`;
    }
    return year.toString();
  }

  /**
   * ArrowUp - navigate to next (newer) year, resetting month
   * Cycles from maxYear to minYear
   */
  function getNextYear(current: string | undefined): string | undefined {
    if (current === undefined || !isValidDate(current)) {
      return formatDate(minYear);
    }
    const [year, month] = parseDate(current);
    // reset month
    if (month) {
      return formatDate(year);
    }
    const nextYear = year === maxYear ? minYear : year + 1;
    return formatDate(nextYear);
  }

  /**
   * ArrowDown - navigate to previous (older) year, resetting month
   * Cycles from minYear to maxYear
   */
  function getPrevYear(current: string | undefined): string | undefined {
    if (current === undefined || !isValidDate(current)) {
      return formatDate(maxYear);
    }
    const [year] = parseDate(current);
    const prevYear = year === minYear ? maxYear : year - 1;
    return formatDate(prevYear);
  }

  /**
   * ArrowRight - navigate to next month (circular)
   * Only works when month is selected
   */
  function getNextMonth(current: string | undefined): string | undefined {
    if (current === undefined || !isValidDate(current)) {
      return;
    }
    const [year, month] = parseDate(current);
    const nextMonth = !month || month === 12 ? 1 : month + 1;
    return formatDate(year, nextMonth);
  }

  /**
   * ArrowLeft - navigate to previous month (circular)
   * Only works when month is selected
   */
  function getPrevMonth(current: string | undefined): string | undefined {
    if (current === undefined || !isValidDate(current)) {
      return;
    }
    const [year, month] = parseDate(current);
    const prevMonth = !month || month === 1 ? 12 : month - 1;
    return formatDate(year, prevMonth);
  }

  // store undefined when not edited and fallback to current value
  let inputValue = $state<undefined | string>();
  let isOpen = $state(false);
  let inputRef: HTMLInputElement | undefined;
  let listElement: HTMLElement | undefined = $state(undefined);
  let blurTimeout: ReturnType<typeof setTimeout> | undefined;

  function resetPicker() {
    isOpen = false;
    inputValue = undefined;
  }

  function selectOption(option: undefined | string) {
    value = option;
    inputRef?.focus();
    resetPicker();
    clearTimeout(blurTimeout);
  }

  let scrollIntoViewTimeoutId: ReturnType<typeof setTimeout> | undefined;

  // Scroll while navigating with keyboard
  function scrollMatchingYearIntoView(behavior: "instant" | "smooth") {
    if (inputValue) {
      const [activeYear] = parseDate(inputValue);
      clearTimeout(scrollIntoViewTimeoutId);
      scrollIntoViewTimeoutId = setTimeout(() => {
        listElement
          ?.querySelector(`#${id}-group-${activeYear}`)
          ?.scrollIntoView({ block: "nearest", behavior });
      });
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (!isOpen) {
      if (
        event.key === "ArrowDown" ||
        event.key === "ArrowUp" ||
        event.key === "Enter" ||
        event.key === " "
      ) {
        event.preventDefault();
        isOpen = true;
        scrollMatchingYearIntoView("instant");
        return;
      }
    }

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        inputValue = getPrevYear(inputValue);
        scrollMatchingYearIntoView("smooth");
        break;
      case "ArrowUp":
        event.preventDefault();
        inputValue = getNextYear(inputValue);
        scrollMatchingYearIntoView("smooth");
        break;
      case "ArrowRight":
        event.preventDefault();
        const nextMonth = getNextMonth(inputValue);
        if (nextMonth) {
          inputValue = nextMonth;
        }
        break;
      case "ArrowLeft":
        event.preventDefault();
        const prevMonth = getPrevMonth(inputValue);
        if (prevMonth) {
          inputValue = prevMonth;
        }
        break;
      case "Enter":
        event.preventDefault();
        selectOption(isValidDate(inputValue) ? inputValue : undefined);
        break;
      case "Escape":
        resetPicker();
        break;
    }
  }

  function handleFocus() {
    // Populate with current value when focused
    inputValue = value;
    isOpen = true;
    scrollMatchingYearIntoView("instant");
    clearTimeout(blurTimeout);
  }

  function handleBlur() {
    // Small delay to allow click on dropdown items to fire first
    blurTimeout = setTimeout(() => {
      if (isOpen) {
        resetPicker();
      }
    }, 150);
  }

  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest(`.date-combobox-${id}`)) {
      resetPicker();
    }
  }

  // Close on click outside
  $effect(() => {
    if (isOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  });
</script>

<div class="date-combobox-{id} date-combobox">
  <input
    bind:this={inputRef}
    {id}
    class="form-input"
    type="text"
    role="combobox"
    aria-expanded={isOpen}
    aria-autocomplete="list"
    aria-controls="{id}-listbox"
    aria-activedescendant={isValidDate(inputValue)
      ? `${id}-option-${inputValue}`
      : undefined}
    aria-haspopup="listbox"
    bind:value={
      () => inputValue ?? value ?? "",
      (newValue) => {
        inputValue = newValue;
        isOpen = true;
        if (isValidDate(newValue)) {
          value = newValue;
          scrollMatchingYearIntoView("instant");
        }
        if (newValue === "") {
          value = undefined;
        }
      }
    }
    onkeydown={handleKeydown}
    onfocus={handleFocus}
    onblur={handleBlur}
    {placeholder}
    autocomplete="off"
  />

  {#if isOpen}
    <div
      bind:this={listElement}
      id="{id}-listbox"
      role="listbox"
      aria-label="Date options"
      class="menu date-menu"
    >
      {#each { length: maxYear - minYear + 1 }, index}
        {@const year = maxYear - index}
        {@const yearValue = formatDate(year)}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <div class="date-group" id="{id}-group-{yearValue}">
          <div
            id="{id}-option-{yearValue}"
            tabindex="-1"
            role="option"
            aria-selected={yearValue === inputValue}
            class="menuitem year-item"
            onclick={() => selectOption(yearValue)}
            onmouseenter={() => (inputValue = yearValue)}
          >
            {yearValue}
          </div>
          {#each MONTHS as label, index}
            {@const monthValue = formatDate(year, index + 1)}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <div
              id="{id}-option-{monthValue}"
              tabindex="-1"
              role="option"
              aria-selected={monthValue === inputValue}
              class="menuitem month-item"
              onclick={() => selectOption(monthValue)}
              onmouseenter={() => (inputValue = monthValue)}
            >
              {label}
            </div>
          {/each}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .date-combobox {
    position: relative;
  }

  .date-menu {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin: var(--space-1) 0;
    max-height: 300px;
    overflow-y: auto;
    z-index: var(--z-dropdown);
  }

  .date-group {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
  }

  .date-group + .date-group {
    border-top: 1px solid var(--color-border);
  }

  .menuitem {
    text-align: center;
  }

  .year-item {
    grid-column: 1 / -1;
    font-weight: bold;
  }
</style>
