<script lang="ts">
  import { page } from "$app/state";
  import Topbar from "$lib/topbar.svelte";
  import ContactCards from "$lib/contact-cards.svelte";

  let { data } = $props();

  const title = "weareonhire!";
  const description =
    "A professional networking platform built on trust and accountability.";

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    url: "https://weareonhire.com",
    name: title,
    description,
  };
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />

  <!-- Open Graph -->
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="weareonhire!" />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:url" content={page.url.toString()} />
  <meta property="og:image" content="{page.url.origin}/og-image.png" />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={title} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image" content="{page.url.origin}/og-image.png" />

  <!-- Structured Data -->
  {@html `<script type="application/ld+json">${JSON.stringify(structuredData)}</script>`}
</svelte:head>

<div class="container">
  <Topbar handle={data.handle} />

  <section class="hero">
    <h1 class="text-heading-1 hero-title">weareonhire!</h1>
    <p class="text-heading-6 hero-tagline">Your professional story, backed by your peers</p>
    <div class="hero-actions">
      {#if data.handle}
        <a
          class="button button-primary button-lg"
          href="/profile/{data.handle}"
        >
          My Profile
        </a>
      {:else}
        <button
          class="button button-primary button-lg"
          commandfor="login-dialog"
          command="show-popover"
        >
          Get Started
        </button>
      {/if}
    </div>
  </section>

  <section class="section">
    <h2 class="text-heading-2 section-title">Why This Exists</h2>
    <div class="columns-3">
      <article class="margin-trim-block text-align-center">
        <p>
          <svg class="subtle" width="48" height="48">
            <use href="#icon-users" />
          </svg>
        </p>
        <h3 class="heading-2">Algorithms Don't Know You</h3>
        <p class="text-wrap-balance">
          ATS filters throw away great candidates over missing keywords. Your
          real skills get buried under buzzword games.
        </p>
      </article>
      <article class="margin-trim-block text-align-center">
        <p>
          <svg class="subtle" width="48" height="48">
            <use href="#icon-print" />
          </svg>
        </p>
        <h3 class="heading-2">Resumes Are Broken</h3>
        <p class="text-wrap-balance">
          Everyone exaggerates to beat the system. Nobody trusts what they read
          anymore.
        </p>
      </article>
      <article class="margin-trim-block text-align-center">
        <p>
          <svg class="subtle" width="48" height="48">
            <use href="#icon-clock" />
          </svg>
        </p>
        <h3 class="heading-2">Months Wasted</h3>
        <p class="text-wrap-balance">
          You apply to hundreds of roles. Ghosted. Companies interview dozens of
          poor fits. <strong>We need human connection back.</strong>
        </p>
      </article>
    </div>
  </section>

  <section class="section section-sm">
    <h2 class="text-heading-2 section-title">How It Works</h2>
    <div class="works-list">
      <article class="margin-trim-block">
        <h3 class="heading-2">Tell Your Story</h3>
        <p class="text-wrap-pretty">
          Skip the keyword games. Just write about what you've actually built,
          what you learned, and what you're proud of. Your profile becomes a
          living story, not a document you send into the void.
        </p>
      </article>
      <article class="margin-trim-block">
        <h3 class="heading-2">Get Endorsed</h3>
        <p class="text-wrap-pretty">
          Ask colleagues or open source collaborators who know your work to
          write a few sentences about what it's like working with you. Real
          validation beats self-reported expertise every time.
        </p>
      </article>
      <article class="margin-trim-block">
        <h3 class="heading-2">Pay It Forward</h3>
        <p class="text-wrap-pretty">
          Vouch for people you'd happily work with again. It's how good people
          help each other find the right opportunities.
        </p>
      </article>
      <article class="margin-trim-block">
        <h3 class="heading-2">Built on AT Protocol</h3>
        <p class="text-wrap-pretty">
          Your professional profile lives on the Atmosphere, the open network
          behind Bluesky. Leave weareonhire! and all recommendations stays with
          you.
        </p>
      </article>
    </div>
  </section>

  <section class="section">
    <h2 class="text-heading-2 section-title">Recent Recommendations</h2>
    <div class="columns-2">
      {#each data.lastRecommendations as rec}
        <div class="margin-trim-block">
          <p class="text-wrap-pretty">{rec.reason}</p>
          <p class="subtle">— {rec.authorName || rec.authorHandle}</p>
        </div>
      {/each}
    </div>
  </section>

  <footer class="section">
    <h2 class="text-heading-2 section-title">Get Involved</h2>
    <ContactCards />
  </footer>
</div>

<style>
  .container {
    min-height: auto;
    display: grid;
    grid-template-rows: max-content;
  }

  /* Hero Section */
  .hero {
    padding: var(--space-12) var(--space-8);
    text-align: center;
    min-height: calc(100dvh - 96px);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .hero-title {
    font-weight: var(--font-weight-medium);
    margin: 0;
  }

  .hero-tagline {
    margin: 0 0 var(--space-6);
  }

  .hero-actions {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-4);
  }

  .section {
    margin-bottom: var(--space-8);
  }

  .section-sm {
    width: 100%;
    max-width: 480px;
    margin-left: auto;
    margin-right: auto;
  }

  /* Section Titles */
  .section-title {
    text-transform: uppercase;
    text-align: center;
    text-decoration-line: underline;
    text-decoration-thickness: 1px;
    text-decoration-color: var(--color-accent);
    text-underline-offset: 6px;
  }

  .columns-2 {
    grid-template-columns: repeat(2, 1fr);
  }

  .columns-3 {
    grid-template-columns: repeat(3, 1fr);
  }

  .columns-2,
  .columns-3 {
    display: grid;
    gap: var(--space-8);
    @media (max-width: 767px) {
      grid-template-columns: 1fr;
    }
  }

  .works-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }

  /* Responsive */
  @media (max-width: 768px) {
    .hero {
      padding: var(--space-12) var(--space-6);
    }
  }
</style>
