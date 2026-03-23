<script lang="ts">
  import "../../../app.css";

  let { data } = $props();
  let profile = $derived(data.profile);
</script>

<div class="container">
  <header class="profile-header">
    <div class="avatar-container">
      {#if profile?.avatar}
        <img
          src={profile.avatar}
          alt="{profile.displayName || profile.handle}'s avatar"
          class="avatar"
        />
      {:else}
        <div class="avatar avatar-placeholder">
          <span
            >{(profile?.displayName ?? profile?.handle ?? "")
              .charAt(0)
              .toUpperCase()}</span
          >
        </div>
      {/if}
    </div>

    <div class="profile-info">
      <h1 class="display-name">{profile?.displayName ?? profile?.handle}</h1>
      <p class="handle">@{profile?.handle}</p>
      {#if profile?.did}
        <p class="did">{profile.did}</p>
      {/if}
    </div>

    <div class="actions">
      {#if profile}
        <a href="/" class="button">Edit CV</a>
        <form method="POST" action="/auth/logout" style="display: inline">
          <button type="submit" class="button button-secondary">Logout</button>
        </form>
      {:else}
        <a href="/login" class="button">Connect to Atmosphere</a>
      {/if}
    </div>
  </header>

  <main class="profile-content">
    {#if profile}
      <div class="welcome">
        <h2>Welcome to your profile!</h2>
        <p>You are connected to the Atmosphere.</p>
      </div>
    {/if}
  </main>
</div>

<style>
  .container {
    max-width: 800px;
    margin: 0 auto;
    padding: var(--space-8);
  }

  .profile-header {
    display: flex;
    align-items: center;
    gap: var(--space-6);
    margin-bottom: var(--space-8);
    padding: var(--space-6);
    background: var(--gray-2);
    border-radius: var(--radius-lg);
  }

  .avatar-container {
    flex-shrink: 0;
  }

  .avatar {
    width: 96px;
    height: 96px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid var(--gray-6);
  }

  .avatar-placeholder {
    background: var(--gray-6);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 36px;
    font-weight: 600;
    color: var(--gray-11);
  }

  .profile-info {
    flex: 1;
  }

  .display-name {
    font-size: var(--text-2xl);
    font-weight: 600;
    margin: 0 0 var(--space-1);
  }

  .handle {
    font-size: var(--text-lg);
    color: var(--gray-11);
    margin: 0;
  }

  .did {
    font-size: var(--text-sm);
    color: var(--gray-10);
    margin: var(--space-1) 0 0;
    font-family: monospace;
    word-break: break-all;
  }

  .actions {
    display: flex;
    gap: var(--space-2);
  }

  .button {
    padding: var(--space-2) var(--space-4);
    background: var(--gray-12);
    color: var(--gray-1);
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
    font-size: var(--text-sm);
    text-decoration: none;
    display: inline-block;
  }

  .button:hover {
    background: var(--gray-11);
  }

  .button-secondary {
    background: var(--gray-7);
    color: var(--gray-1);
  }

  .button-secondary:hover {
    background: var(--gray-6);
  }

  .profile-content {
    padding: var(--space-4);
  }

  .welcome {
    text-align: center;
    padding: var(--space-8);
    background: var(--gray-2);
    border-radius: var(--radius-lg);
  }

  .welcome h2 {
    margin-bottom: var(--space-2);
  }

  @media (max-width: 640px) {
    .profile-header {
      flex-direction: column;
      text-align: center;
    }

    .avatar {
      width: 80px;
      height: 80px;
    }
  }
</style>
