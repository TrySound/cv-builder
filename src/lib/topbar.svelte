<script lang="ts">
  import { isAtIdentifierString } from "@atproto/lex";

  let {
    handle,
    inviteCode,
  }: { handle: undefined | string; inviteCode?: string } = $props();

  const handleConnectSubmit = (event: SubmitEvent) => {
    const form = event.currentTarget as HTMLFormElement;
    const handle = form.elements.namedItem("handle") as HTMLInputElement;
    if (!isAtIdentifierString(handle.value)) {
      event.preventDefault();
      handle.setCustomValidity(
        "Please enter a valid handle, DID, or a full PDS URL",
      );
      handle.reportValidity()
    }
  };
</script>

<header class="topbar">
  <a class="heading-1 topbar-title" href="/members">WAOH!</a>
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
    <a
      target="_blank"
      href="https://github.com/TrySound/weareonhire"
      class="menuitem"
      role="menuitem"
    >
      GitHub
    </a>
    {#if handle}
      <a href="/members" class="menuitem" role="menuitem">Members</a>
      <a href="/invite" class="menuitem" role="menuitem">Invite</a>
      <!-- svelte-ignore a11y_autofocus -->
      <a href="/profile/{handle}" class="menuitem" role="menuitem" autofocus>
        Profile
      </a>
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
      CV Builder uses the
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
        <input
          type="text"
          id="topbar-login-handle-input"
          name="handle"
          placeholder="e.g., user.bsky.social"
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

  form {
    display: grid;
  }
</style>
