<script lang="ts">
  import Topbar from "$lib/topbar.svelte";
  import UploadResumeDialog from "$lib/upload-resume-dialog.svelte";
  import type { Resume } from "$lib/jsonresume";
  import { updateMemberProfile } from "$lib/profile.remote";
  import { createRecommendation as createRecommendationRaw } from "$lib/recommendation.remote";
  import { getChecks } from "./checks.remote";
  import { page } from "$app/state";

  const { data } = $props();

  const title = "Getting Started | weareonhire!";
  const description =
    "Welcome to weareonhire! Complete your profile setup by uploading your resume, giving recommendations, and inviting your peers to the community.";

  const checks = getChecks();

  const createRecommendation = $derived(
    createRecommendationRaw.for(data.inviter?.handle ?? ""),
  );

  let recommendationDialog: undefined | HTMLDialogElement;

  // Track completion status
  const hasResume = $derived(checks.current?.hasResume ?? false);
  const hasRecommendedBack = $derived(
    checks.current?.hasRecommendedBack ?? false,
  );
  const hasInvited = $derived(checks.current?.hasInvited ?? false);

  async function handleResumeUpload(resume: Resume) {
    // Save the resume to the profile
    try {
      await updateMemberProfile(resume);
      await checks.refresh();
    } catch (e) {
      console.error("Failed to save profile:", e);
    }
  }
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />

  <!-- Open Graph -->
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:type" content="website" />
  <meta property="og:url" content={page.url.toString()} />
  <meta property="og:image" content="{page.url.origin}/og-image.png" />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={title} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image" content="{page.url.origin}/og-image.png" />
</svelte:head>

<div class="container">
  <Topbar hideLogo />

  <main class="content">
    <h1 class="heading-1">Welcome to weareonhire!</h1>
    <p class="subtitle">Let's get you started with a few quick steps</p>

    <div class="cards-grid">
      <!-- Upload Resume Card -->
      <div class="card" class:completed={hasResume}>
        <div class="card-content">
          {#if hasResume}
            <svg width="32" height="32">
              <use href="#icon-check" />
            </svg>
          {:else}
            <svg width="32" height="32">
              <use href="#icon-upload" />
            </svg>
          {/if}
          <h3 class="heading-2">Upload Resume</h3>
          <p class="subtle">
            Upload your resume to automatically fill your profile
          </p>
        </div>
        {#if hasResume}
          <p>Completed</p>
        {:else}
          <div>
            <button
              class="button button-primary"
              commandfor="upload-resume-dialog"
              command="show-modal"
            >
              Upload Resume
            </button>
          </div>
        {/if}
      </div>

      <!-- Give Recommendation Back Card -->
      <div class="card" class:completed={hasRecommendedBack}>
        <div class="card-content">
          {#if hasRecommendedBack}
            <svg width="32" height="32">
              <use href="#icon-check" />
            </svg>
          {:else}
            <svg width="32" height="32">
              <use href="#icon-heart" />
            </svg>
          {/if}
          <h3 class="heading-2">Give Recommendation Back</h3>
          <p class="subtle">
            {#if data.inviter}
              Write a recommendation back to {data.inviter.name ||
                data.inviter.handle}, who invited you
            {:else}
              Write a recommendation to the person who invited you
            {/if}
          </p>
        </div>
        {#if hasRecommendedBack}
          <p>Completed</p>
        {:else}
          <div>
            <button
              class="button button-primary"
              commandfor="getting-started-recommendation-dialog"
              command="show-modal"
            >
              Write Recommendation
            </button>
          </div>
        {/if}
      </div>

      <!-- Invite Peers Card -->
      <div class="card" class:completed={hasInvited}>
        <div class="card-content">
          {#if hasInvited}
            <svg width="32" height="32">
              <use href="#icon-check" />
            </svg>
          {:else}
            <svg width="32" height="32">
              <use href="#icon-users" />
            </svg>
          {/if}
          <h3 class="heading-2">Invite Your Peers</h3>
          <p class="subtle">
            Invite colleagues and friends you trust to join the community
          </p>
        </div>
        {#if hasInvited}
          <span>Completed</span>
        {:else}
          <div>
            <a href="/invite" class="button button-primary">Invite Peers</a>
          </div>
        {/if}
      </div>
    </div>
    <div>
      <a href="https://chat.weaonrehire.com" target="_blank" class="link">
        Chat with community
      </a>
    </div>
  </main>
</div>

<UploadResumeDialog onUpload={handleResumeUpload} />

<!-- Recommendation Dialog -->
<dialog
  bind:this={recommendationDialog}
  id="getting-started-recommendation-dialog"
  class="dialog"
  closedby="any"
>
  <header class="dialog-header">
    <h2 class="dialog-title">Recommendation</h2>
    <button
      class="icon-button"
      aria-label="Close"
      commandfor="getting-started-recommendation-dialog"
      command="close"
    >
      <svg width="20" height="20">
        <use href="#icon-x" />
      </svg>
    </button>
  </header>

  <div class="dialog-content">
    <p class="dialog-description">
      Write a recommendation for {data.inviter?.name || data.inviter?.handle}
    </p>
    <form
      {...createRecommendation.enhance(async ({ form, submit }) => {
        await submit();
        await checks.refresh();
        form.reset();
        // remote functions do not support method=dialog
        // so use enhanced form to close it manually after submission
        recommendationDialog?.close();
      })}
      class="form-stack"
    >
      <input
        {...createRecommendation.fields.handle.as(
          "hidden",
          data.inviter?.handle ?? "",
        )}
      />
      <div class="form-group">
        <label for="recommendation-text" class="form-label">
          Your recommendation
          <span class="character-count">
            {createRecommendation.fields.reason.value()?.length ?? 0} / 200 characters
          </span>
        </label>
        <textarea
          id="recommendation-text"
          rows="6"
          class="form-input"
          placeholder="Write your recommendation here..."
          minlength="200"
          {...createRecommendation.fields.reason.as("text")}
        ></textarea>
      </div>
      <div>
        <button class="button button-primary">Send Recommendation</button>
      </div>
    </form>
  </div>
</dialog>

<style>
  .container {
    display: flex;
    flex-direction: column;
    min-height: 100dvh;
  }

  .content {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-8);
    text-align: center;
  }

  .cards-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-8);
    max-width: 900px;
    width: 100%;
    margin-top: var(--space-8);
    margin-bottom: var(--space-12);
  }

  .card {
    display: grid;
    grid-template-rows: 1fr max-content;
    padding: var(--space-8);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    transition: all var(--transition-fast);
    background: var(--color-bg-elevated);

    p {
      margin-top: 0;
    }
  }

  .card:hover {
    border-color: var(--color-border-strong);
  }

  .card.completed {
    border-color: var(--color-success);
    background: var(--color-bg-success);
  }

  .card-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-4);
  }

  .character-count {
    float: right;
    font-weight: normal;
    color: var(--color-text-tertiary);
    font-size: var(--font-size-sm);
  }

  @media (max-width: 768px) {
    .cards-grid {
      grid-template-columns: 1fr;
    }

    .content {
      padding: var(--space-6);
    }
  }
</style>
