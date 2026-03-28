<script lang="ts">
  import { page } from "$app/state";
  import Topbar from "$lib/topbar.svelte";

  let { data, form } = $props();

  let name = $state("");
  let recommendationText = $state("");
  let charCount = $derived(recommendationText.length);

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }
</script>

<div class="container">
  <Topbar handle={data.handle} />

  <h1 class="heading-2">Create Invitation</h1>
  <p class="subtle">
    Invite someone to join the community with a personal recommendation.
  </p>

  <form method="POST" class="card-lg form-stack" action="?/create">
    <div class="form-group">
      <label for="name" class="form-label">Invitation Name</label>
      <input
        type="text"
        id="name"
        name="name"
        bind:value={name}
        placeholder="e.g., My colleague from Meta"
        required
        class="form-input"
      />
    </div>

    <div class="form-group">
      <label for="recommendation_text" class="form-label">
        Recommendation
        <span class="char-count">
          {charCount}/200
        </span>
      </label>
      <textarea
        id="recommendation_text"
        name="recommendation_text"
        bind:value={recommendationText}
        placeholder="Write a recommendation letter..."
        minlength="200"
        required
        class="form-input"
      ></textarea>
    </div>

    {#if form?.error}
      <div class="alert alert-error">{form.error}</div>
    {/if}

    <button type="submit" class="button">Generate Invite Link</button>
  </form>

  {#if form?.success && form.inviteUrl}
    <div class="alert alert-success">
      <h2 class="heading-3">Invitation Created!</h2>
      <p>Share this link with your invitee:</p>
      <div class="invite-link">
        <code>{page.url.origin}{form.inviteUrl}</code>
        <button
          type="button"
          class="button-small"
          onclick={() => copyToClipboard(`${page.url.origin}${form.inviteUrl}`)}
        >
          Copy
        </button>
      </div>
    </div>
  {/if}

  {#if data.invitations.length > 0}
    <div class="invitations-list">
      <h2 class="heading-3">Your Invitations</h2>
      <div class="list">
        {#each data.invitations as invitation}
          <div class="card-lg invitation-card">
            <div class="invitation-header">
              <h3 class="heading-3">{invitation.name}</h3>
              <span class="badge">
                {invitation.used_count}/{invitation.max_uses} used
              </span>
            </div>
            <p class="recommendation-preview">
              {invitation.recommendation_text.slice(0, 100)}...
            </p>
            <div class="invitation-actions">
              <code class="invite-code"
                >{page.url.origin}/invite/{invitation.code}</code
              >
              <button
                type="button"
                class="button-small"
                onclick={() =>
                  copyToClipboard(
                    `${page.url.origin}/invite/${invitation.code}`,
                  )}
              >
                Copy Link
              </button>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .char-count {
    float: right;
    font-weight: normal;
    color: var(--color-text-tertiary);
    font-size: var(--font-size-sm);
  }

  .invite-link {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    background: var(--color-bg-elevated);
    padding: var(--space-3);
    border-radius: var(--radius-md);
    margin-top: var(--space-3);
  }

  .invite-link code {
    flex: 1;
    font-family: var(--font-mono);
    font-size: var(--font-size-sm);
  }

  .invitations-list {
    margin-top: var(--space-8);
  }

  .list {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    margin-top: var(--space-4);
  }

  .invitation-card {
    padding: var(--space-4);
  }

  .invitation-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-2);
  }

  .recommendation-preview {
    color: var(--color-text-tertiary);
    font-size: var(--font-size-sm);
    margin-bottom: var(--space-3);
  }

  .invitation-actions {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .invite-code {
    flex: 1;
    font-family: var(--font-mono);
    font-size: var(--font-size-xs);
    color: var(--color-text-tertiary);
  }
</style>
