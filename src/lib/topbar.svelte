<script lang="ts">
  import { isAtIdentifierString } from "@atproto/lex";

  let {
    handle,
    role,
    inviteCode,
    hideLogo = false,
  }: {
    handle: undefined | string;
    role?: "member" | "visitor";
    inviteCode?: string;
    hideLogo?: boolean;
  } = $props();

  const handleConnectSubmit = (event: SubmitEvent) => {
    const form = event.currentTarget as HTMLFormElement;
    const handle = form.elements.namedItem("handle") as HTMLInputElement;
    if (
      !isAtIdentifierString(handle.value) &&
      !handle.value.startsWith("https://")
    ) {
      event.preventDefault();
      handle.setCustomValidity(
        "Please enter a valid handle, DID, or a full PDS URL",
      );
      handle.reportValidity();
    }
  };
</script>

<header class="topbar">
  {#if !hideLogo}
    <a class="heading-1 topbar-logo" href="/">WAOH!</a>
  {:else}
    <span></span>
  {/if}

  <nav class="nav">
    <a href="/feed" class="link">Feed</a>
    {#if handle}
      {#if role === "member"}
        <a href="/invite" class="link">Invite</a>
      {/if}
      <button
        class="link"
        commandfor="desktop-auth-menu"
        command="toggle-popover"
      >
        Account
      </button>
      <div id="desktop-auth-menu" popover class="menu-popover">
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
          <form method="POST" action="/auth/logout">
            <button role="menuitem" class="menuitem">Disconnect</button>
          </form>
        </div>
      </div>
    {:else}
      <button
        class="link"
        commandfor="topbar-login-dialog"
        command="show-modal"
      >
        Connect to Atmosphere
      </button>
    {/if}
  </nav>

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
</header>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  id="topbar-menu"
  popover
  class="menu-popover"
  onclick={(event) => event.currentTarget.hidePopover()}
>
  <div class="menu" role="menu">
    <!-- svelte-ignore a11y_autofocus -->
    <a href="/feed" role="menuitem" class="menuitem" autofocus>Feed</a>
    {#if handle}
      <a href="/profile/{handle}" role="menuitem" class="menuitem">@{handle}</a>
      {#if role === "member"}
        <a href="/invite" role="menuitem" class="menuitem">Invite</a>
      {/if}
      <form method="POST" action="/auth/logout">
        <button role="menuitem" class="menuitem">Disconnect</button>
      </form>
    {:else}
      <!-- svelte-ignore a11y_autofocus -->
      <button
        class="menuitem"
        role="menuitem"
        autofocus
        commandfor="topbar-login-dialog"
        command="show-modal"
      >
        Connect to Atmosphere
      </button>
    {/if}
  </div>
</div>

<dialog id="topbar-login-dialog" closedby="any" class="dialog">
  <header class="dialog-header">
    <h2 class="dialog-title">Connect to Atmosphere</h2>
    <button
      class="icon-button"
      aria-label="Close"
      commandfor="topbar-login-dialog"
      command="close"
    >
      <svg width="20" height="20">
        <use href="#icon-x" />
      </svg>
    </button>
  </header>

  <div class="dialog-content">
    <p class="dialog-description">
      weareonhire uses the
      <a class="link" target="_blank" href="https://atproto.com/">AT Protocol</a
      >
      to power its social features, allowing users to own their data and use one account
      for all compatible applications. Once you create an account, you can use other
      apps like
      <a class="link" target="_blank" href="https://bsky.app/">Bluesky</a>
      and
      <a class="link" target="_blank" href="https://tangled.org/">Tangled</a>
      with the same account.
    </p>

    <details class="dialog-details">
      <summary class="subtle">Troubleshooting</summary>
      <p class="dialog-description">
        Having trouble with Bluesky signup due to captcha? You can use
        <strong>npmx.social</strong> as your personal data server (PDS) instead.
        Enter <code>https://npmx.social</code> in the handle field above and press
        Connect to create an account on the npmx server, then use it to access Bluesky
        later.
      </p>
    </details>

    <form
      class="form-stack"
      method="get"
      action="/auth/login"
      onsubmit={handleConnectSubmit}
    >
      <input type="hidden" name="code" value={inviteCode} />
      <input type="hidden" name="prompt" value="login" />
      <div class="form-group">
        <label for="topbar-login-handle-input" class="form-label">Handle</label>
        <!-- svelte-ignore a11y_autofocus -->
        <input
          type="text"
          id="topbar-login-handle-input"
          name="handle"
          placeholder="e.g., user.bsky.social"
          autocomplete="off"
          inputmode="url"
          autofocus
          required
          class="form-input"
          oninput={(event) => event.currentTarget.setCustomValidity("")}
        />
      </div>
      <button class="button button-primary">Connect</button>
    </form>

    <hr class="separator" />

    <form method="get" action="/auth/login">
      <input type="hidden" name="code" value={inviteCode} />
      <input type="hidden" name="prompt" value="create" />
      <button class="button">Create a new account</button>
    </form>
  </div>
</dialog>

<style>
  .topbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-2) 0;
    min-height: 60px;
    margin-bottom: var(--space-4);
    border-bottom: 1px solid var(--color-border);
  }

  .topbar-logo {
    text-decoration: none;
    view-transition-name: logo;
  }

  .nav {
    display: flex;
    gap: var(--space-8);
    align-items: center;
  }

  .mobile-menu-trigger {
    display: none;
  }

  .menu-popover {
    position-area: bottom span-left;
    padding: 0;
    margin: var(--space-3) 0;
    background: transparent;
    border: 0;
    min-width: 120px;
    color: inherit;
  }

  form {
    display: grid;
  }

  @media (max-width: 640px) {
    .nav {
      display: none;
    }
    .mobile-menu-trigger {
      display: block;
    }
  }
</style>
