<script lang="ts">
  import { page } from "$app/state";
  import { getAccountData } from "$lib/account.remote";
  import { acceptInvitation } from "$lib/invitation.remote";
  import Topbar from "$lib/topbar.svelte";

  let { data } = $props();

  const account = getAccountData();

  const inviterDisplayName = $derived(
    data.invitation.invitedBy.name || data.invitation.invitedBy.handle,
  );

  // Error messages for different error types
  const errorMessages: Record<string, { title: string; description: string }> =
    {
      invalid_handle: {
        title: "Account not found",
        description:
          "The handle you entered doesn't exist on Bluesky. Make sure you have a valid Bluesky account, or create one first.",
      },
      oauth_failed: {
        title: "Authentication failed",
        description:
          "Something went wrong during login. This can happen if the login took too long. Please try joining again.",
      },
      invite_expired: {
        title: "Invitation expired",
        description:
          "This invitation has reached its maximum uses and is no longer valid.",
      },
      not_invited: {
        title: "Not authorized",
        description:
          "You need a valid invitation to join this community. Please make sure you're using the correct invitation link.",
      },
    };
</script>

<div class="container">
  <Topbar />

  <div class="recommendation-section">
    <h2 class="heading-2">Invitation for {data.invitation.name}</h2>
    <p>
      {inviterDisplayName} has invited you to join the community with this recommendation.
    </p>
    <div class="quote">
      <p>{data.invitation.recommendationText}</p>
    </div>
  </div>

  {#if data.errorType && errorMessages[data.errorType]}
    <div class="alert alert-error" role="alert">
      <h3>{errorMessages[data.errorType]?.title}</h3>
      <p>
        {errorMessages[data.errorType]?.description}
      </p>
      {#if data.errorType === "invalid_handle"}
        <p>
          New to Bluesky? <a
            href="https://bsky.app/"
            target="_blank"
            class="link">Create an account first</a
          >, then return here to join.
        </p>
      {/if}
    </div>
  {/if}

  {#if account.current?.handle === data.invitation.invitedBy.handle}
    <div>
      <p>
        This is your invitation link. Share it with someone you'd like to
        invite.
      </p>
      <code class="invite-url">
        {`${page.url.origin}/invite/${data.invitation.code}`}
      </code>
    </div>
  {:else if account.current?.handle}
    {#if data.hasAlreadyRecommended}
      <div class="alert alert-success">
        <p>You're already have recommendation from this user.</p>
        <a href="/profile/{data.invitation.invitedBy.handle}" class="button">
          View {inviterDisplayName}'s Profile
        </a>
      </div>
    {:else}
      <form {...acceptInvitation}>
        <p class="subtle">
          You're already a community member. Accept this recommendation from {inviterDisplayName}.
        </p>
        <input
          {...acceptInvitation.fields.code.as("hidden", data.invitation.code)}
        />
        <button class="button button-primary">Accept</button>
      </form>
    {/if}
  {:else}
    <div>
      <button
        class="button button-primary"
        commandfor="topbar-login-dialog"
        command="show-modal"
      >
        Join Community
      </button>
    </div>
  {/if}
</div>

<style>
  .container {
    display: grid;
    grid-auto-rows: min-content;
    gap: var(--space-8);
  }

  .recommendation-section h2 {
    margin-bottom: var(--space-4);
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
