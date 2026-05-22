<script lang="ts">
  import { page } from "$app/state";
  import Topbar from "$lib/topbar.svelte";
  import { getProfile } from "$lib/profile.remote";
  import { getPublications } from "$lib/publication.remote";
  import { formatDate } from "$lib/date.js";

  let { data } = $props();

  const author = $derived(page.url.searchParams.get("author") ?? "");

  const profile = $derived(
    author ? await getProfile({ handle: author }) : null,
  );

  const publications = $derived(
    author ? await getPublications({ author }) : { publications: [] },
  );

  const authorName = $derived(profile?.name ?? author);

  const title = $derived(`Publications by ${authorName} | weareonhire!`);
  const description = $derived(
    `View all publications by ${authorName} on weareonhire!`,
  );
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

  <section class="publications-section" aria-label="Publications">
    <div class="row">
      <div><!-- skip column --></div>
      <h2 class="heading-2 subtle">Publications by {authorName}</h2>
    </div>

    {#if publications.publications.length > 0}
      {#each publications.publications as publication}
        <article class="row">
          <div>
            {#if publication.publishedAt}
              <time class="subtle" datetime={publication.publishedAt}>
                {formatDate(publication.publishedAt)}
              </time>
            {/if}
          </div>
          <div class="margin-trim-block">
            <h3 class="body">
              <a href={publication.url} target="_blank" class="link">
                {publication.title}
              </a>
            </h3>
            {#if publication.description}
              <p class="subtle">{publication.description}</p>
            {/if}
          </div>
        </article>
      {/each}
    {:else}
      <div class="row">
        <div><!-- skip column --></div>
        <div class="margin-trim-block">
          <p class="subtle">No publications found</p>
        </div>
      </div>
    {/if}
  </section>
</div>

<style>
  .publications-section {
    display: grid;
    gap: var(--space-8);
    margin-bottom: var(--space-12);
  }
</style>
