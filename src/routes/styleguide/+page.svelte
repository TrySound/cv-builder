<script lang="ts">
  import Topbar from "$lib/topbar.svelte";
  import Combobox from "$lib/combobox.svelte";
  import MultiSelectCombobox from "$lib/multi-select-combobox.svelte";
  import DatePicker from "$lib/date-picker.svelte";
  import ContactCards from "$lib/contact-cards.svelte";

  // Icons list from app.html SVG sprite
  const icons = [
    "icon-plus",
    "icon-pencil",
    "icon-trash",
    "icon-check",
    "icon-minus-circle",
    "icon-website",
    "icon-github",
    "icon-linkedin",
    "icon-email",
    "icon-location",
    "icon-menu",
    "icon-x",
    "icon-copy",
    "icon-upload",
    "icon-print",
    "icon-heart",
    "icon-users",
    "icon-chevron-down",
    "icon-bluesky",
    "icon-telegram",
    "icon-discord",
    "icon-clock",
    "icon-sun",
  ];

  // Color tokens to display
  const colorTokens = [
    "--color-text",
    "--color-text-secondary",
    "--color-text-tertiary",
    "--color-text-muted",
    "--color-text-placeholder",
    "--color-bg",
    "--color-bg-elevated",
    "--color-bg-hover",
    "--color-border",
    "--color-border-input",
    "--color-accent",
    "--color-backdrop",
  ];

  // Spacing tokens
  const spacingTokens = [
    { name: "--space-1", value: "0.25rem" },
    { name: "--space-2", value: "0.5rem" },
    { name: "--space-3", value: "0.75rem" },
    { name: "--space-4", value: "1rem" },
    { name: "--space-5", value: "1.25rem" },
    { name: "--space-6", value: "1.5rem" },
    { name: "--space-8", value: "2rem" },
    { name: "--space-12", value: "3rem" },
  ];

  // Shadow tokens
  const shadowTokens = ["--shadow-md", "--shadow-xl"];

  // Interactive demo state
  let comboboxValue = $state("");
  let comboboxOptions = $state([
    { value: "typescript", label: "TypeScript" },
    { value: "svelte", label: "Svelte" },
    { value: "react", label: "React" },
    { value: "vue", label: "Vue" },
    { value: "angular", label: "Angular" },
  ]);

  let multiSelected = $state<{ value: string; label: string }[]>([
    { value: "typescript", label: "TypeScript" },
  ]);

  let dateValue = $state<string | undefined>("2024-06");
</script>

<svelte:head>
  <title>Styleguide | weareonhire!</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="container">
  <Topbar handle={undefined} />

  <section>
    <h1 class="text-heading-1">Styleguide</h1>
    <p>
      A living reference for all design tokens, components, and patterns used in
      weareonhire!
    </p>
  </section>

  <section id="typography">
    <h2 class="text-heading-2">
      <a class="link" href="#typography">#</a> Typography
    </h2>
    <div class="margin-trim-block">
      <p class="text-heading-1">Heading 1</p>
      <p class="text-heading-2">Heading 2</p>
      <p class="text-heading-3">Heading 3</p>
      <p class="text-heading-4">Heading 4</p>
      <p class="text-heading-5">Heading 5</p>
      <p class="text-heading-6">Heading 6</p>
      <p class="text-body">
        This is body text. It <strong>inherits</strong> the font and color from the
        root.
      </p>
      <p class="subtle">This is subtle text, used for secondary info.</p>
    </div>
  </section>

  <section id="spacing">
    <h2 class="text-heading-2">
      <a class="link" href="#spacing">#</a> Spacing
    </h2>
    {#each spacingTokens as token}
      <div class="spacing-row">
        <div
          class="spacing-block"
          style="width: var({token.name}); height: var({token.name});"
        ></div>
        <code class="item-name">{token.name} ({token.value})</code>
      </div>
    {/each}
  </section>

  <section id="colors">
    <h2 class="text-heading-2"><a class="link" href="#colors">#</a> Colors</h2>
    <div class="form-grid">
      {#each colorTokens as token}
        <div class="form-group">
          <div class="swatch" style="--color: var({token});"></div>
          <code class="item-name">{token}</code>
        </div>
      {/each}
    </div>
  </section>

  <section id="shadows">
    <h2 class="text-heading-2">
      <a class="link" href="#shadows">#</a> Shadows
    </h2>
    <div class="form-grid">
      {#each shadowTokens as token}
        <div class="swatch" style="box-shadow: var({token});">
          <code class="item-name">{token}</code>
        </div>
      {/each}
    </div>
  </section>

  <section id="icons">
    <h2 class="text-heading-2"><a class="link" href="#icons">#</a> Icons</h2>
    <div class="form-grid">
      {#each icons as icon}
        <div class="swatch">
          <svg width="24" height="24">
            <use href="#{icon}" />
          </svg>
          <code class="item-name">{icon}</code>
        </div>
      {/each}
    </div>
  </section>

  <section id="buttons">
    <h2 class="text-heading-2">
      <a class="link" href="#buttons">#</a> Buttons
    </h2>
    <button class="button">Default</button>
    <button class="button button-primary">Primary</button>
    <button class="button button-lg">Large</button>
    <button class="button button-primary button-lg"> Primary Large </button>
    <button class="button" data-state="loading">Loading</button>
    <button class="icon-button" aria-label="Edit">
      <svg width="20" height="20">
        <use href="#icon-pencil" />
      </svg>
    </button>
    <button class="icon-button" aria-label="Delete">
      <svg width="20" height="20">
        <use href="#icon-trash" />
      </svg>
    </button>
  </section>

  <section id="links">
    <h2 class="text-heading-2"><a class="link" href="#links">#</a> Links</h2>
    <div>
      <a class="link" href="#buttons">Text link</a>
    </div>
    <div>
      <button class="link">Button as link</button>
    </div>
    <div>
      <a class="link" href="#buttons">
        <svg width="14" height="14"><use href="#icon-linkedin" /></svg>
        Link with icon
      </a>
    </div>
  </section>

  <section id="chips">
    <h2 class="text-heading-2"><a class="link" href="#chips">#</a> Chips</h2>
    <div class="chip-group">
      <span class="chip">TypeScript</span>
      <span class="chip">Svelte</span>
      <span class="chip">Remote</span>
      <span class="chip">
        Verified
        <svg width="14" height="14"><use href="#icon-check" /></svg>
      </span>
    </div>
  </section>

  <section id="form-elements">
    <h2 class="text-heading-2">
      <a class="link" href="#form-elements">#</a> Form Elements
    </h2>

    <div class="form-stack">
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label" for="sg-input">Input</label>
          <input
            id="sg-input"
            class="form-input"
            placeholder="Placeholder text"
          />
        </div>
        <div class="form-group">
          <label class="form-label" for="sg-select">Select</label>
          <select id="sg-select" class="form-input">
            <option class="menuitem" value="">Select an option</option>
            <option class="menuitem" value="1">Option One</option>
            <option class="menuitem" value="2">Option Two</option>
            <option class="menuitem" value="3">Option Three</option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" for="sg-textarea">Textarea</label>
        <textarea
          id="sg-textarea"
          class="form-input"
          placeholder="Write something..."
        ></textarea>
      </div>

      <div class="form-actions">
        <button class="button button-primary">Save</button>
        <button class="button">Cancel</button>
      </div>
    </div>
  </section>

  <section id="alerts">
    <h2 class="text-heading-2"><a class="link" href="#alerts">#</a> Alerts</h2>
    <div class="form-stack">
      <div class="alert alert-success">
        Success! Your profile has been updated.
      </div>
      <div class="alert alert-error">
        Error! Something went wrong. Please try again.
      </div>
      <div class="alert alert-info">
        Info! This is an informational message.
      </div>
    </div>
  </section>

  <section id="dialog">
    <h2 class="text-heading-2"><a class="link" href="#dialog">#</a> Dialog</h2>
    <button class="button" commandfor="styleguide-dialog" command="show-modal">
      Open Dialog
    </button>
    <dialog id="styleguide-dialog" class="dialog" closedby="any">
      <header class="dialog-header">
        <h2 class="dialog-title">Dialog Title</h2>
        <button
          class="icon-button"
          aria-label="Close"
          commandfor="styleguide-dialog"
          command="close"
        >
          <svg width="20" height="20">
            <use href="#icon-x" />
          </svg>
        </button>
      </header>
      <div class="dialog-content">
        <p class="dialog-description">
          This is a dialog using the .dialog, .dialog-header, .dialog-content,
          and .dialog-title classes.
        </p>
        <div class="form-actions">
          <button
            class="button button-primary"
            commandfor="styleguide-dialog"
            command="close"
          >
            Confirm
          </button>
          <button class="button" commandfor="styleguide-dialog" command="close">
            Cancel
          </button>
        </div>
      </div>
    </dialog>
  </section>

  <section id="popover-menu">
    <h2 class="text-heading-2">
      <a class="link" href="#popover-menu">#</a> Popover Menu
    </h2>
    <button
      class="button"
      commandfor="styleguide-popover"
      command="toggle-popover"
    >
      Toggle Popover
    </button>
    <div id="styleguide-popover" popover class="popover">
      <div class="menu">
        <a href="#popover" class="menuitem" role="menuitem">Action One</a>
        <a href="#popover" class="menuitem" role="menuitem">Action Two</a>
        <button class="menuitem" role="menuitem">Action Three</button>
      </div>
    </div>
  </section>

  <section id="spinner">
    <h2 class="text-heading-2">
      <a class="link" href="#spinner">#</a> Spinner
    </h2>
    <div class="spinner-container" style="min-height: auto;">
      <div class="spinner"></div>
      <span class="subtle">Loading...</span>
    </div>
  </section>

  <section id="separator">
    <h2 class="text-heading-2">
      <a class="link" href="#separator">#</a> Separator
    </h2>
    <p>Content above</p>
    <hr class="separator" />
    <p>Content below</p>
  </section>

  <section id="pickers">
    <h2 class="text-heading-2">
      <a class="link" href="#pickers">#</a> Pickers
    </h2>
    <div class="form-grid">
      <div>
        <label for="sg-combobox" class="form-label">Combobox</label>
        <Combobox
          id="sg-combobox"
          value={comboboxValue}
          options={comboboxOptions}
          placeholder="Search frameworks..."
          oninput={() => {}}
          onfocus={() => {}}
          onblur={() => {}}
          onselect={(option) => (comboboxValue = option.value)}
        >
          {#snippet optionSnippet(option)}
            <span>{option.label}</span>
          {/snippet}
        </Combobox>
        <p class="subtle">Selected: {comboboxValue || "none"}</p>
      </div>

      <div>
        <label for="sg-multi" class="form-label">Multi-Select Combobox</label>
        <MultiSelectCombobox
          id="sg-multi"
          options={comboboxOptions}
          bind:selected={multiSelected}
          placeholder="Select skills..."
          allowCustom
        />
      </div>

      <div>
        <label for="sg-date" class="form-label">Date Picker</label>
        <DatePicker
          id="sg-date"
          bind:value={dateValue}
          placeholder="Pick a date..."
        />
        <p class="subtle">Selected: {dateValue || "none"}</p>
      </div>
    </div>
  </section>

  <footer class="section">
    <h2 class="text-heading-2">Get Involved</h2>
    <ContactCards />
  </footer>
</div>

<style>
  .item-name {
    font-size: var(--text-size--1);
    color: var(--color-text-tertiary);
    font-family: var(--font-mono);
  }

  .swatch {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 120px;
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border);
    background-color: var(--color);
  }

  .popover {
    position-area: bottom span-right;
  }

  /* Spacing rows */
  .spacing-row {
    display: grid;
    grid-template-columns: max-content 1fr;
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-2) 0;
  }

  .spacing-block {
    background: var(--color-text-secondary);
    border-radius: var(--radius-md);
  }
</style>
