<script lang="ts">
  import { formatDate } from "$lib/date";
  import Topbar from "$lib/topbar.svelte";

  let { data } = $props();
</script>

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
