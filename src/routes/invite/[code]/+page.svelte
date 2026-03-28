<script lang="ts">
  import { page } from "$app/state";
  import Topbar from "$lib/topbar.svelte";

  let { data } = $props();

  const inviterDisplayName = $derived(
    data.invitation.invitedBy.name || data.invitation.invitedBy.handle,
  );
</script>

<div class="container">
  <Topbar handle={data.handle} inviteCode={data.inviteCode} />

  <div class="card-lg">
    <div class="recommendation-section">
      <h2 class="heading-3">Invitation for {data.invitation.name}</h2>
      <p class="subtle">
        {inviterDisplayName} has invited you to join the community with this recommendation.
      </p>
      <div class="recommendation-quote">
        <p>{data.invitation.recommendationText}</p>
      </div>
    </div>

    {#if data.handle === data.invitation.invitedBy.handle}
      <div class="alert alert-info">
        <p>
          This is your invitation link. Share it with someone you'd like to
          invite.
        </p>
        <code class="invite-url">
          {`${page.url.origin}/invite/${data.invitation.code}`}
        </code>
      </div>
    {:else if data.handle}
      {#if data.hasAlreadyRecommended}
        <div class="alert alert-success">
          <p>You're already have recommendation from this user.</p>
          <a href="/profile/{data.invitation.invitedBy.handle}" class="button">
            View {inviterDisplayName}'s Profile
          </a>
        </div>
      {:else}
        <form method="POST" action="?/accept">
          <p class="subtle">
            You're already a community member. Accept this recommendation from {inviterDisplayName}.
          </p>
          <button type="submit" class="button">Recommend Back</button>
        </form>
      {/if}
    {:else}
      <button
        class="button button-primary"
        commandfor="topbar-login-dialog"
        command="show-modal"
      >
        Join Community
      </button>
    {/if}
  </div>
</div>

<style>
  .recommendation-section h2 {
    margin-bottom: var(--space-4);
  }

  .recommendation-quote {
    background: var(--color-bg);
    padding: var(--space-6);
    border-radius: var(--radius-md);
    border-left: 4px solid var(--color-primary);
    margin-bottom: var(--space-6);
  }

  .recommendation-quote p {
    margin: 0;
    line-height: var(--line-height-relaxed);
    font-size: var(--font-size-lg);
    color: var(--color-text);
    white-space: pre-wrap;
  }

  .invite-url {
    display: block;
    background: var(--color-bg-elevated);
    color: var(--color-text);
    padding: var(--space-3);
    border-radius: var(--radius-md);
    font-family: var(--font-mono);
    font-size: var(--font-size-sm);
    word-break: break-all;
    margin-top: var(--space-3);
  }
</style>
