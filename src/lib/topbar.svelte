<script lang="ts">
  let {
    handle,
    inviteCode,
  }: { handle: undefined | string; inviteCode?: string } = $props();

  function handleLoginSubmit(event: SubmitEvent) {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);
    const handle = formData.get("handle")?.toString().trim() ?? "";
    const searchParams = new URLSearchParams();
    searchParams.set("handle", handle.trim());
    if (inviteCode) {
      searchParams.set("code", inviteCode);
    }
    window.location.href = `/auth/login?${searchParams.toString()}`;
  }
</script>

<header class="topbar">
  <a href={handle ? "/members" : "/"} class="heading-1 topbar-title">
    CV Builder
  </a>
  <button class="icon-button" popovertarget="topbar-menu" aria-label="Menu">
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
    {#if handle}
      <!-- svelte-ignore a11y_autofocus -->
      <a href="/profile/{handle}" class="menuitem" role="menuitem" autofocus>
        Profile
      </a>
      <a href="/members" class="menuitem" role="menuitem">Members</a>
      <a href="/invite" class="menuitem" role="menuitem">Invite</a>
      <form method="POST" action="/auth/logout">
        <button class="menuitem" role="menuitem">Logout</button>
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
    <a
      href="https://github.com/TrySound/cv-builder"
      class="menuitem"
      role="menuitem"
    >
      GitHub
    </a>
  </div>
</div>

<dialog id="topbar-login-dialog" closedby="any" class="dialog">
  <header class="dialog-header">
    <h2 class="dialog-title">Atmosphere</h2>
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

  <form method="dialog" class="dialog-content" onsubmit={handleLoginSubmit}>
    <p class="dialog-description">Connect with your Atmosphere account</p>

    <div class="form-group">
      <label for="topbar-login-handle" class="form-label">Handle</label>
      <input
        type="text"
        id="topbar-login-handle"
        class="form-input"
        name="handle"
        placeholder="your-handle.bsky.social"
        autocomplete="username"
        required
      />
      <details class="login-info">
        <summary class="subtle">What is an Atmosphere account?</summary>
        <p>
          CV Builder uses the AT Protocol to let you own your CV data and
          connect with the professional community. Use your existing Bluesky
          account to join, or create a new one to get started.
        </p>
      </details>
      <button type="submit" class="button button-primary">Connect</button>
    </div>

    <!--
    <hr class="separator">

    <button type="button" class="button">Create a new account</button>
    -->
  </form>
</dialog>

<style>
  .topbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-4) 0;
    margin-bottom: var(--space-4);
    border-bottom: 1px solid var(--color-border);
  }

  .topbar-title {
    text-decoration: none;
  }

  .menu-popover {
    position-area: bottom span-left;
    padding: 0;
    margin: var(--space-2) 0;
    background: transparent;
    border: 0;
    min-width: 80px;
  }

  .login-info {
    margin: var(--space-2) 0;
  }

  .login-info p {
    margin: var(--space-1) 0 0;
    font-size: var(--font-size-sm);
    line-height: var(--line-height-relaxed);
    color: var(--color-text-secondary);
  }
</style>
