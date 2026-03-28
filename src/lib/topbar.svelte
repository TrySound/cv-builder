<script lang="ts">
  let { handle }: { handle: undefined | string } = $props();
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
      <a href="/login" class="menuitem" role="menuitem" autofocus>
        Connect to Atmosphere
      </a>
    {/if}
  </div>
</div>

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
</style>
