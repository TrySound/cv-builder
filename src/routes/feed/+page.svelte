<script lang="ts">
  import { page } from "$app/state";
  import { formatDate } from "$lib/date";
  import Topbar from "$lib/topbar.svelte";

  let { data } = $props();

  const title = "Feed | weareonhire!";
  const description =
    "Discover the latest peer recommendations from the weareonhire! community. See what professionals are saying about their colleagues.";
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
  <Topbar handle={data.handle} />

  <main class="recommendations-list">
    {#each data.recommendations as item}
      <article class="row link-area">
        <div>
          <time class="subtle" datetime={item.createdAt}>
            {formatDate(item.createdAt)}
          </time>
        </div>
        <div class="margin-trim-block">
          <p>
            <a href="/profile/{item.authorHandle}" class="link">
              {item.authorName || item.authorHandle}
            </a>
            <span class="subtle">recommended</span>
            <a href="/profile/{item.subjectHandle}" class="link">
              {item.subjectName || item.subjectHandle}
            </a>
          </p>
          <p>
            {item.reason}
          </p>
        </div>
        <a
          class="link-target"
          href="/profile/{item.subjectHandle}#recommendation-{item.uri}"
          aria-label="Full post"
        ></a>
      </article>
    {/each}
  </main>
</div>

<style>
  .recommendations-list {
    display: grid;
    margin: var(--space-12) 0;
  }
</style>
