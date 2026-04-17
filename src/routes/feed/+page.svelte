<script lang="ts">
  import Topbar from "$lib/topbar.svelte";

  let { data } = $props();

  function formatDate(dateString: string | undefined): string {
    if (!dateString) {
      return "";
    }
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
</script>

<div class="container">
  <Topbar handle={data.handle} role={data.role} />

  <div class="recommendations-list">
    {#each data.recommendations as item}
      <article>
        <div>
          <a
            href="/profile/{item.subjectHandle}#recommendation-{item.uri}"
            class="link"
          >
            {item.subjectHandle}
          </a>
          <span class="subtle">was recommended by</span>
          <a href="/profile/{item.authorHandle}" class="link">
            {item.authorHandle}
          </a>
        </div>
        <div class="subtle">
          {formatDate(item.createdAt)}
        </div>
      </article>
    {/each}
  </div>
</div>

<style>
  .recommendations-list {
    display: grid;
    gap: var(--space-4);
    margin: var(--space-6) 0;
  }
</style>
