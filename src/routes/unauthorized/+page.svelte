<script lang="ts">
  import { goto } from "$app/navigation";
</script>

<div class="unauthorized-container">
  <div class="unauthorized-card">
    <h1 class="heading-1">Access Denied</h1>
    <p class="description">
      You are not authorized to access this closed community.
    </p>
    <p class="sub-description">
      Only approved members can view and edit profiles.
    </p>
    <div class="actions">
      <a href="/" class="button">Back to Home</a>
    </div>
  </div>
</div>

<style>
  .unauthorized-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-4);
  }

  .unauthorized-card {
    text-align: center;
    max-width: 400px;
  }

  .unauthorized-card h1 {
    margin-bottom: var(--space-4);
    color: var(--color-danger);
  }

  .description {
    font-size: var(--font-size-lg);
    margin-bottom: var(--space-2);
    color: var(--color-text);
  }

  .sub-description {
    font-size: var(--font-size-sm);
    color: var(--color-text-tertiary);
    margin-bottom: var(--space-6);
  }

  .actions {
    display: flex;
    gap: var(--space-3);
    justify-content: center;
  }
</style>
