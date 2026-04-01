<script lang="ts">
  import Topbar from "$lib/topbar.svelte";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();
</script>

<div class="container">
  <Topbar handle={data.handle} hideLogo />

  <main class="hero">
    <div>
      <h1 class="hero-title">weareonhire!</h1>
      <p>An invite-only community for professionals</p>
      <p class="subtle">Population: {data.memberCount}, and counting</p>
      <div class="hero-actions">
        <a href="mailto:hire@weareonhire.com" class="button button-primary">
          Hire an expert
        </a>
      </div>
    </div>
  </main>
</div>

<footer class="footer">
  <h2 class="heading-1">Get Involved</h2>
  <div class="get-involved-grid">
    <a
      class="button"
      target="_blank"
      href="https://github.com/TrySound/weareonhire"
    >
      <div class="involved-card">
        <h3 class="heading-2">Contribute</h3>
        <p class="subtle">Help us build weareonhire!</p>
        <p>View on GitHub</p>
      </div>
    </a>
    <a class="button" target="_blank" href="https://discord.gg/Axdhf8x47F">
      <div class="involved-card">
        <h3 class="heading-2">Join the Community</h3>
        <p class="subtle">Chat, ask questions, and share ideas.</p>
        <p>Join Discord</p>
      </div>
    </a>
    <a
      class="button"
      target="_blank"
      href="https://bsky.app/profile/trysound.io"
    >
      <div class="involved-card">
        <h3 class="heading-2">Stay Updated</h3>
        <p class="subtle">Get the latest updates and announcements.</p>
        <p>Follow on Bluesky</p>
      </div>
    </a>
  </div>
</footer>

<style>
  .container {
    display: flex;
    flex-direction: column;
    min-height: 100dvh;
  }

  .heading-1 {
    text-transform: uppercase;
    margin-bottom: var(--space-8);
  }

  .hero {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
  }

  .hero-title {
    font-size: var(--font-size-4xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text);
    margin: 0 0 var(--space-8);
    letter-spacing: -0.02em;
  }

  .hero-actions {
    display: flex;
    gap: var(--space-3);
    justify-content: center;
    flex-wrap: wrap;
    margin-top: var(--space-8);
  }

  .footer {
    padding: var(--space-12) var(--space-8);
    text-align: center;
  }

  .get-involved-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-8);
    max-width: 900px;
    margin: 0 auto;
  }

  .involved-card {
    text-align: center;
    padding: var(--space-6);
  }

  @media (max-width: 768px) {
    .get-involved-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 640px) {
    .hero-title {
      font-size: var(--font-size-3xl);
    }
  }
</style>
