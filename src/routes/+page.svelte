<script lang="ts">
  import { page } from "$app/state";
  import { searchProfiles } from "$lib/search.remote.js";
  import Topbar from "$lib/topbar.svelte";

  let { data } = $props();

  const title = "Home | weareonhire!";
  const description =
    "A professional networking platform built on trust and accountability.";

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "weareonhire!",
    url: "https://weareonhire.com",
    description,
  };

  // Input value (can differ from query during typing)
  let inputValue = $state("");
  // Query used for actual search (synced with URL)
  let query = $state("");
  let queryTimeoutId: ReturnType<typeof setTimeout>;
  // Track whether to show search results - prevents reactivity issues
  let showResults = $state(false);
  // do not invoke query initially to avoid reactivity issues
  // "This query instance is no longer active and can no longer be used for reactive state access"
  const searchQuery = $derived(
    query.length > 0 ? searchProfiles({ q: query }) : undefined,
  );
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
  <Topbar handle={data.handle} hideLogo />

  <section class="hero">
    <h1 class="hero-title">weareonhire!</h1>
    <p class="hero-tagline">Your professional story, backed by your peers</p>
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
          commandfor="topbar-login-dialog"
          command="show-modal"
        >
          Connect to Atmosphere
        </button>
      {/if}
    </div>
  </section>

  <section class="section">
    <h2 class="section-title">Why This Exists</h2>
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
    <h2 class="section-title">How It Works</h2>
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

  <!-- temporary hide the section -->
  {#if 1 > 5}
    <section class="section section-sm">
      <h2 class="section-title">Find Professionals</h2>
      <div class="search-form">
        <input
          type="text"
          name="q"
          autocomplete="off"
          placeholder="Search by name, handle, or expertise..."
          class="form-input form-input-lg"
          bind:value={
            () => inputValue,
            (newValue) => {
              inputValue = newValue;
              showResults = newValue.length > 0;
              clearTimeout(queryTimeoutId);
              queryTimeoutId = setTimeout(() => {
                query = newValue;
              }, 300);
            }
          }
        />
        <button
          class="button button-lg"
          data-state={(inputValue.length > 0 && inputValue !== query) ||
          searchQuery?.loading
            ? "loading"
            : "idle"}
        >
          Search
        </button>
      </div>

      {#if showResults}
        <div class="results-list">
          {#each searchQuery?.current?.results as result (result.handle)}
            <a href="/profile/{result.handle}" class="button result-item">
              {#if result.avatar}
                <img src={result.avatar} alt="" class="result-avatar" />
              {:else}
                <div class="result-avatar-placeholder"></div>
              {/if}
              <div class="result-item-content">
                <div class="result-handle">@{result.handle}</div>
                {#if result.displayName}
                  <div class="subtle">
                    {result.displayName}
                  </div>
                {/if}
              </div>
            </a>
          {:else}
            {#if !searchQuery?.loading}
              <p class="subtle">
                No users found matching "{searchQuery?.current?.query ?? ""}"
              </p>
            {/if}
          {/each}
        </div>
      {/if}
    </section>
  {/if}

  <section class="section">
    <h2 class="section-title">Recent Recommendations</h2>
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
    <h2 class="section-title">Get Involved</h2>
    <div class="columns-3">
      <a class="button" target="_blank" href="https://repo.weareonhire.com">
        <div class="involved-card margin-trim-block">
          <p>
            <svg width="32" height="32">
              <use href="#icon-github" />
            </svg>
          </p>
          <h3 class="heading-2">Contribute</h3>
          <p class="subtle">Help us build weareonhire!</p>
          <p>View on GitHub</p>
        </div>
      </a>
      <a class="button" target="_blank" href="https://chat.weareonhire.com">
        <div class="involved-card margin-trim-block">
          <p>
            <svg width="32" height="32">
              <use href="#icon-discord" />
            </svg>
          </p>
          <h3 class="heading-2">Join the Community</h3>
          <p class="subtle">Chat, ask questions, and share ideas.</p>
          <p>Join Discord</p>
        </div>
      </a>
      <a class="button" target="_blank" href="https://social.weareonhire.com">
        <div class="involved-card margin-trim-block">
          <p>
            <svg width="32" height="32">
              <use href="#icon-bluesky" />
            </svg>
          </p>
          <h3 class="heading-2">Stay Updated</h3>
          <p class="subtle">Get the latest updates and announcements.</p>
          <p>Follow on Bluesky</p>
        </div>
      </a>
    </div>
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
    font-size: var(--font-size-4xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text);
    margin: 0 0 var(--space-4);
    letter-spacing: -0.02em;
  }

  .hero-tagline {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    margin: 0 0 var(--space-6);
    line-height: var(--line-height-tight);
  }

  .hero-actions {
    margin-top: var(--space-8);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-4);
  }

  .section {
    display: grid;
    gap: var(--space-12);
    margin: var(--space-12) 0;
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
    margin: 0;
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text);
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
    @media (max-width: 640px) {
      grid-template-columns: 1fr;
    }
  }

  .search-form {
    display: grid;
    align-items: center;
    grid-template-columns: 1fr max-content;
    gap: var(--space-3);
  }

  .results-list {
    display: grid;
    gap: var(--space-3);
  }

  .result-item {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: var(--space-3);
    text-align: left;
  }

  .result-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    object-fit: cover;
  }

  .result-avatar-placeholder {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background-color: var(--color-border);
  }

  .result-item-content {
    overflow: hidden;
  }

  .result-handle {
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  }

  .involved-card {
    text-align: center;
    padding: var(--space-4);
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

    .hero-title {
      font-size: var(--font-size-3xl);
    }

    .hero-tagline {
      font-size: var(--font-size-lg);
    }
  }
</style>
