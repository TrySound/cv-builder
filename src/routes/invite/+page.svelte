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

  <h1 class="heading-2">Invitations</h1>
  <p class="subtle">
    Invite someone to join the community with a personal recommendation.
  </p>

  <form method="POST" class="form-stack" action="?/create">
    <div class="form-group">
      <label for="invite-recommendation-name" class="form-label">
        Invitation Name
      </label>
      <input
        type="text"
        id="invite-recommendation-name"
        name="name"
        bind:value={name}
        placeholder="e.g., My colleague from Meta"
        required
        class="form-input"
      />
    </div>

    <div class="form-group">
      <label for="invite-recommendation-input" class="form-label">
        Recommendation
        <span class="char-count">
          {charCount}/200
        </span>
      </label>
      <textarea
        id="invite-recommendation-input"
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

    <div>
      <button class="button">Generate Invite Link</button>
    </div>
  </form>

  {#if data.invitations.length > 0}
    <div class="list">
      {#each data.invitations as invitation}
        <div class="invite">
          <h3 class="heading-3 subtle">{invitation.name}</h3>
          <p class="subtle">
            {invitation.recommendation_text}
          </p>
          <div class="invite-actions">
            <code class="invite-code">
              {page.url.origin}/invite/{invitation.code}
            </code>
            <button
              type="button"
              class="button"
              onclick={() => {
                copyToClipboard(`${page.url.origin}/invite/${invitation.code}`);
              }}
            >
              Copy Link
            </button>
          </div>
        </div>
      {/each}
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

  .list {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    margin-top: var(--space-12);
  }

  .invite-actions {
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
