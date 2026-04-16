<script lang="ts">
  import { searchProfiles } from "$lib/search.remote.js";
  import Topbar from "$lib/topbar.svelte";

  let { data } = $props();

  // Input value (can differ from query during typing)
  let inputValue = $state("");
  // Query used for actual search (synced with URL)
  let query = $state("");
  let queryTimeoutId: ReturnType<typeof setTimeout>;
  // do not invoke query initially to avoid reactivity issues
  // "This query instance is no longer active and can no longer be used for reactive state access"
  const searchQuery = $derived(
    query.length > 0 ? searchProfiles({ q: query }) : undefined,
  );

  // svelte-ignore state_referenced_locally
  let mode: "hero" | "search" = $state(query.length === 0 ? "hero" : "search");
</script>

<div class="container">
  <Topbar handle={data.handle} role={data.role} hideLogo={mode === "hero"} />

  <main class="hero" data-mode={mode}>
    <div class="hero-base">
      <h1 class="hero-title" hidden={mode === "search"}>weareonhire!</h1>
      <!--
      <p>An community for professionals</p>
      <p class="subtle">Population: {data.memberCount}, and counting</p>
      <div class="hero-actions">
        <a href="mailto:hire@weareonhire.com" class="button button-primary">
          Hire an expert
        </a>
      </div>
      -->

      <div class="search-form">
        <input
          type="text"
          name="q"
          autocomplete="off"
          placeholder="Search for professionals..."
          class="form-input form-input-lg"
          bind:value={
            () => inputValue,
            (newValue) => {
              inputValue = newValue;

              // Trigger mode transition immediately for responsive UI
              if (mode === "hero" && newValue.length > 0) {
                document.startViewTransition(() => {
                  mode = "search";
                });
              }

              clearTimeout(queryTimeoutId);
              queryTimeoutId = setTimeout(() => {
                query = newValue;
              }, 300);
            }
          }
          onblur={() => {
            if (inputValue.length === 0 && mode === "search") {
              clearTimeout(queryTimeoutId);
              document.startViewTransition(() => {
                mode = "hero";
              });
            }
          }}
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
    </div>

    {#if mode === "search"}
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
  </main>
</div>

<footer class="footer">
  <h2 class="heading-1">Get Involved</h2>
  <div class="get-involved-grid">
    <a class="button" target="_blank" href="https://repo.weareonhire.com">
      <div class="involved-card">
        <h3 class="heading-2">Contribute</h3>
        <p class="subtle">Help us build weareonhire!</p>
        <p>View on GitHub</p>
      </div>
    </a>
    <a class="button" target="_blank" href="https://chat.weareonhire.com">
      <div class="involved-card">
        <h3 class="heading-2">Join the Community</h3>
        <p class="subtle">Chat, ask questions, and share ideas.</p>
        <p>Join Discord</p>
      </div>
    </a>
    <a class="button" target="_blank" href="https://social.weareonhire.com">
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
    min-height: 100dvh;
    display: grid;
    grid-template-rows: max-content 1fr;
  }

  .heading-1 {
    text-transform: uppercase;
    margin-bottom: var(--space-8);
  }

  .hero {
    display: grid;
    justify-self: center;
    align-items: center;
    gap: var(--space-8);
    text-align: center;
    max-width: 480px;
    width: 100%;
    padding: var(--space-8) 0;
    &[data-mode="search"] {
      grid-auto-rows: max-content;
      align-items: start;
    }
  }

  .hero-base {
    view-transition-name: match-element;
  }

  .hero-title {
    font-size: var(--font-size-4xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text);
    margin: 0 0 var(--space-8);
    letter-spacing: -0.02em;
    view-transition-name: logo;
  }

  /*
  .hero-actions {
    display: flex;
    gap: var(--space-3);
    justify-content: center;
    flex-wrap: wrap;
    margin-top: var(--space-8);
  }
*/

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

    .hero-title {
      font-size: var(--font-size-3xl);
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
</style>
