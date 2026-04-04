<script lang="ts">
  import { page } from "$app/state";
  import Topbar from "$lib/topbar.svelte";
  import {
    createInvitation,
    getMyInvitations,
  } from "$lib/invitation.remote.js";

  let { data } = $props();

  const invitations = getMyInvitations();
</script>

<div class="container">
  <Topbar handle={data.handle} />

  <h1 class="heading-2">Invitations</h1>
  <p class="subtle">
    Invite someone to join the community with a personal recommendation.
  </p>

  <form class="form-stack" {...createInvitation}>
    <div class="form-group">
      <label for="invite-recommendation-name" class="form-label">
        Invitation Name
      </label>
      <input
        id="invite-recommendation-name"
        placeholder="e.g., My colleague from Meta"
        required
        class="form-input"
        {...createInvitation.fields.name.as("text")}
      />
    </div>

    <div class="form-group">
      <label for="invite-recommendation-input" class="form-label">
        Recommendation
        <span class="char-count">
          {createInvitation.fields.recommendation_text.value()?.length ?? 0}/200
        </span>
      </label>
      <textarea
        id="invite-recommendation-input"
        placeholder="Write a recommendation letter..."
        minlength="200"
        required
        class="form-input"
        {...createInvitation.fields.recommendation_text.as("text")}
      ></textarea>
    </div>

    <div>
      <button class="button">Generate Invite Link</button>
    </div>
  </form>

  <div class="list">
    {#each invitations.current as invitation}
      {@const inviteUrl = `${page.url.origin}/invite/${invitation.code}`}
      <div class="invite">
        <h3 class="heading-3 subtle invite-heading">
          <a class="link" href={inviteUrl}>
            {invitation.name}
          </a>
          <button
            class="icon-button"
            aria-label="Copy invite link"
            onclick={() => navigator.clipboard.writeText(inviteUrl)}
          >
            <svg width="20" height="20">
              <use href="#icon-copy" />
            </svg>
          </button>
        </h3>
        <div class="quote">
          <p>
            {invitation.recommendation_text}
          </p>
        </div>
      </div>
    {/each}
  </div>
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

  .invite {
    display: grid;
    gap: var(--space-4);
  }

  .invite-heading {
    display: flex;
    gap: var(--space-3);
    align-items: center;
  }
</style>
