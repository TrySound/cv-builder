<script lang="ts">
  import Topbar from "$lib/topbar.svelte";

  let { data } = $props();
</script>

<div class="container">
  <Topbar handle={data.handle} />

  <main class="profile-content">
    {#if data.handle}
      <div class="welcome">
        <h2>Welcome to your profile!</h2>
        <p>You are connected to the Atmosphere.</p>
      </div>
    {/if}
  </main>
</div>

<style>
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
</style>
