<script lang="ts">
  import { page } from "$app/state";
  import { goto } from "$app/navigation";
  import { getTheme, toggleTheme, type Theme } from "$lib/theme";
  import { searchProfiles } from "$lib/search.remote";
  import Combobox from "$lib/combobox.svelte";
  import LoginDialog from "$lib/login-dialog.svelte";

  let {
    handle,
    hideLogo = false,
  }: {
    handle: undefined | string;
    hideLogo?: boolean;
  } = $props();

  const redirectUrl = $derived(page.url.pathname);

  let currentTheme: Theme = $state("dark");

  $effect(() => {
    currentTheme = getTheme();
  });

  // Search state
  let searchInput = $state("");
  let searchQuery = $state("");
  let queryTimeoutId = $state<undefined | ReturnType<typeof setTimeout>>();

  const searchResults = $derived(
    searchQuery.trim().length > 0
      ? searchProfiles({ q: searchQuery })
      : undefined,
  );

  const isLoading = $derived(
    // prevent accessing stale search results when query is empty
    searchQuery.length > 0 && searchResults?.loading === true,
  );
  const isPending = $derived(queryTimeoutId != undefined || isLoading);

  const searchOptions = $derived.by(() => {
    // prevent accessing stale search results when query is empty
    if (searchQuery.length === 0) {
      return [];
    }
    return (
      searchResults?.current?.results.map((result) => ({
        value: result.handle,
        handle: result.handle,
        displayName: result.displayName,
        avatar: result.avatar,
      })) ?? []
    );
  });

  function handleSearchInput(value: string) {
    searchInput = value;
    clearTimeout(queryTimeoutId);
    queryTimeoutId = setTimeout(() => {
      queryTimeoutId = undefined;
      searchQuery = value;
    }, 200);
  }

  const handleThemeToggle = () => {
    currentTheme = toggleTheme(currentTheme);
  };
</script>

<header class="topbar">
  <div class="logo-and-search">
    {#if !hideLogo}
      <a class="heading-1 topbar-logo" href="/">WAOH!</a>
    {:else}
      <span></span>
    {/if}

    <div class="search-wrapper">
      <Combobox
        id="topbar-search"
        bind:value={searchInput}
        options={searchOptions}
        placeholder="Find your peers on Atmosphere..."
        loading={isPending}
        oninput={handleSearchInput}
        onfocus={() => {}}
        onblur={() => {}}
        onselect={(option) => {
          goto(`/profile/${option.handle}`);
          searchInput = "";
          searchQuery = "";
        }}
      >
        {#snippet optionSnippet(option)}
          <div class="search-result-item">
            {#if option.avatar}
              <img src={option.avatar} alt="" class="search-result-avatar" />
            {:else}
              <div class="search-result-avatar-placeholder"></div>
            {/if}
            <div class="search-result-info">
              {#if option.displayName}
                <div class="truncate">{option.displayName}</div>
              {/if}
              <div class="subtle truncate">@{option.handle}</div>
            </div>
          </div>
        {/snippet}
      </Combobox>
    </div>
  </div>

  <nav class="nav">
    <div class="nav-links">
      <a href="/feed" class="link">Feed</a>
      {#if handle}
        <button
          class="link"
          commandfor="desktop-auth-menu"
          command="toggle-popover"
        >
          Account
        </button>
        <div id="desktop-auth-menu" popover class="popover menu-popover">
          <div class="menu" role="menu">
            <!-- svelte-ignore a11y_autofocus -->
            <a
              href="/profile/{handle}"
              role="menuitem"
              class="menuitem"
              autofocus
            >
              @{handle}
            </a>
            <a href="/resume/{handle}" role="menuitem" class="menuitem">
              Resume
            </a>
            <form method="POST" action="/auth/logout">
              <input type="hidden" name="redirect" value={redirectUrl} />
              <button role="menuitem" class="menuitem">Disconnect</button>
            </form>
          </div>
        </div>
      {:else}
        <button class="link" commandfor="login-dialog" command="toggle-popover">
          Sign in
        </button>
      {/if}
    </div>

    <button
      class="icon-button"
      aria-label={currentTheme === "light"
        ? "Switch to dark mode"
        : "Switch to light mode"}
      onclick={handleThemeToggle}
    >
      <svg width="20" height="20" aria-hidden="true">
        <use href="#icon-sun" />
      </svg>
    </button>

    <button
      class="icon-button mobile-menu-trigger"
      commandfor="topbar-menu"
      command="toggle-popover"
      aria-label="Menu"
    >
      <svg width="24" height="24">
        <use href="#icon-menu" />
      </svg>
    </button>
  </nav>
</header>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  id="topbar-menu"
  popover
  class="popover menu-popover"
  onclick={(event) => event.currentTarget.hidePopover()}
>
  <div class="menu" role="menu">
    <!-- svelte-ignore a11y_autofocus -->
    <a href="/feed" role="menuitem" class="menuitem" autofocus>Feed</a>
    {#if handle}
      <a href="/profile/{handle}" role="menuitem" class="menuitem">@{handle}</a>
      <a href="/resume/{handle}" role="menuitem" class="menuitem">Resume</a>
      <form method="POST" action="/auth/logout">
        <input type="hidden" name="redirect" value={redirectUrl} />
        <button role="menuitem" class="menuitem">Disconnect</button>
      </form>
    {:else}
      <!-- svelte-ignore a11y_autofocus -->
      <button
        class="menuitem"
        role="menuitem"
        autofocus
        commandfor="login-dialog"
        command="toggle-popover"
      >
        Sign in
      </button>
    {/if}
  </div>
</div>

<LoginDialog {redirectUrl} />

<style>
  .topbar {
    position: relative;
    display: grid;
    gap: var(--space-4);
    grid-template-columns: 1fr max-content;
    padding: var(--space-2) 0;
    min-height: 60px;
    margin-bottom: var(--space-12);
    border-bottom: 1px solid var(--color-border);
    anchor-name: --topbar;
  }

  .logo-and-search {
    min-width: 0;
    display: grid;
    gap: var(--space-8);
    grid-template-columns: var(--row-side-size) 1fr;
    align-items: center;
  }

  .topbar-logo {
    text-decoration: none;
    view-transition-name: logo;
  }

  .search-wrapper {
    background: var(--color-bg);
    display: grid;
    align-items: center;
    max-width: 320px;
  }

  @media (max-width: 640px) {
    .logo-and-search {
      gap: var(--space-4);
      grid-template-columns: max-content 1fr;
    }

    .search-wrapper {
      max-width: none;
      &:has(:global(input):focus) {
        position: absolute;
        inset: 0;
      }
    }
  }

  .search-result-item {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: var(--space-3);
    align-items: center;
    padding: var(--space-2) 0;
  }

  .search-result-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
  }

  .search-result-avatar-placeholder {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background-color: var(--color-border);
  }

  .search-result-info {
    display: grid;
  }

  .nav {
    display: flex;
    gap: var(--space-4);
    align-items: center;
  }

  .nav-links {
    display: contents;
    @media (max-width: 640px) {
      display: none;
    }
  }

  .mobile-menu-trigger {
    display: none;
    @media (max-width: 640px) {
      display: flex;
    }
  }

  .menu-popover {
    position-area: bottom span-left;
    min-width: 120px;
  }

  form {
    display: grid;
  }
</style>
