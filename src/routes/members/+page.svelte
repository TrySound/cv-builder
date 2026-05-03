<script lang="ts">
  import Topbar from "$lib/topbar.svelte";

  let { data } = $props();

  function formatDate(dateString: string | undefined): string {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
</script>

<div class="container">
  <Topbar />

  <div class="member-list">
    {#each data.members as member}
      <article>
        <div>
          <a href="/profile/{member.handle}" class="link">
            {member.name || member.handle}
          </a>
          {#if member.headline}
            <span>| {member.headline}</span>
          {/if}
        </div>
        <div class="subtle">
          <span>
            Joined {formatDate(member.created_at)}
          </span>
          {#if member.inviter_name || member.inviter_handle}
            <span>
              | Invited by
              <a href="/profile/{member.inviter_handle}" class="link">
                {member.inviter_name || member.inviter_handle}
              </a>
            </span>
          {/if}
        </div>
      </article>
    {/each}
  </div>
</div>

<style>
  .member-list {
    display: grid;
    gap: var(--space-4);
    margin: var(--space-6) 0;
  }
</style>
