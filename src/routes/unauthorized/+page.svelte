<script lang="ts">
  import { page } from "$app/state";

  const title = "Access Denied | weareonhire!";
  const description =
    "You are not authorized to access this closed community. Only approved members can view and edit profiles on weareonhire!";
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <meta name="robots" content="noindex, nofollow" />

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

<div class="outer">
  <div class="container">
    <h1 class="heading-1">Access Denied</h1>
    <p>You are not authorized to access this closed community.</p>
    <p>Only approved members can view and edit profiles.</p>
    <a href="/" class="link">Back to Home</a>
  </div>
</div>

<style>
  .outer {
    display: flex;
    min-height: 100dvh;
  }

  .container {
    text-align: center;
    max-width: 400px;
    margin: auto;
  }
</style>
