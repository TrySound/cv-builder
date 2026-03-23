<script lang="ts">
  import "../../app.css";

  let handle = $state("");
  let error = $state("");

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!handle.trim()) {
      error = "Please enter your handle";
      return;
    }
    // Redirect to the auth API endpoint with handle
    const searchParams = new URLSearchParams();
    searchParams.set("handle", handle.trim());
    window.location.href = `/auth/login?${searchParams.toString()}`;
  }
</script>

<div class="login-container">
  <div class="login-card">
    <div class="login-header">
      <h1 class="heading-1">Connect to Atmosphere</h1>
      <p class="login-description">
        Enter your Bluesky handle to connect your CV to the Atmosphere.
      </p>
    </div>

    <form onsubmit={handleSubmit} class="login-form">
      <div class="form-group">
        <label for="handle" class="form-label">Your Handle</label>
        <input
          type="text"
          id="handle"
          name="handle"
          bind:value={handle}
          placeholder="your-handle.bsky.social"
          class="form-input"
          autocomplete="username"
        />
      </div>

      {#if error}
        <p class="error-message">{error}</p>
      {/if}

      <button type="submit" class="button button-primary"> Connect </button>
    </form>

    <div class="login-footer">
      <a href="/" class="link">← Back to CV Editor</a>
    </div>
  </div>
</div>

<style>
  .login-container {
    margin: auto;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-4);
  }

  .login-card {
    width: 100%;
    max-width: 400px;
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xl);
    padding: var(--space-8);
  }

  .login-header {
    text-align: center;
    margin-bottom: var(--space-6);
  }

  .login-header h1 {
    margin-bottom: var(--space-2);
  }

  .login-description {
    color: var(--color-text-tertiary);
    font-size: var(--font-size-sm);
    margin: 0;
    line-height: var(--line-height-relaxed);
  }

  .login-form {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .error-message {
    color: var(--color-danger);
    font-size: var(--font-size-sm);
    margin: 0;
  }

  .button-primary {
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
    color: white;
    border: none;
    padding: var(--space-3) var(--space-4);
  }

  .button-primary:hover {
    background: linear-gradient(135deg, #4338ca 0%, #6d28d9 100%);
  }

  .login-footer {
    margin-top: var(--space-6);
    text-align: center;
  }
</style>
