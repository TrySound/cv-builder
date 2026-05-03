<script lang="ts">
  import { page } from "$app/state";
  import { formatDate } from "$lib/date";
  import Topbar from "$lib/topbar.svelte";

  let { data } = $props();

  const title = "Feed | weareonhire!";
  const description =
    "Discover the latest peer recommendations and new members from the weareonhire! community.";
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

  <main class="feed-list">
    {#each data.feed as item}
      <article class="row link-area">
        <div>
          <time class="subtle" datetime={item.createdAt}>
            {formatDate(item.createdAt)}
          </time>
        </div>
        <div class="margin-trim-block">
          {#if item.type === "user"}
            <p class="subtle">
              <a href="/profile/{item.handle}" class="link">
                {item.name || item.handle}
              </a>
              <span>joined weareonhire!</span>
            </p>
            {#if item.introduction}
              <p class="overflow-wrap-anywhere">{item.introduction}</p>
            {/if}
          {/if}
          {#if item.type === "recommendation"}
            <p class="subtle">
              <a href="/profile/{item.authorHandle}" class="link">
                {item.authorName || item.authorHandle}
              </a>
              <span>recommended</span>
              <a href="/profile/{item.subjectHandle}" class="link">
                {item.subjectName || item.subjectHandle}
              </a>
            </p>
            <p class="overflow-wrap-anywhere">{item.reason}</p>
          {/if}
        </div>
        {#if item.type === "user"}
          <a
            class="link-target"
            href="/profile/{item.handle}"
            aria-label="View profile"
          ></a>
        {/if}
        {#if item.type === "recommendation"}
          <a
            class="link-target"
            href="/profile/{item.subjectHandle}#recommendation-{item.uri}"
            aria-label="View full recommendation"
          ></a>
        {/if}
      </article>
    {/each}
  </main>
</div>

<style>
  .feed-list {
    display: grid;
    margin: var(--space-12) calc(var(--space-4) * -1);
  }
</style>
