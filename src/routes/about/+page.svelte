<script lang="ts">
  import { page } from "$app/state";
  import ContactCards from "$lib/contact-cards.svelte";
  import Topbar from "$lib/topbar.svelte";

  const title = "About | weareonhire!";
  const description =
    "A professional networking platform built on trust and accountability. Learn about weareonhire!, the Atmosphere, and how we store resume data.";
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
</svelte:head>

<div class="container">
  <Topbar handle={undefined} />

  <main class="content">
    <section aria-label="About weareonhire" class="margin-trim-block">
      <h1 class="hero-title">About weareonhire!</h1>

      <p>
        An open social network where members maintain verified,
        recommendation-backed profiles. Think of it as a living resume that
        grows with your network — your professional reputation, backed by real
        people.
      </p>
    </section>

    <section aria-label="Why it was built?" class="margin-trim-block">
      <h2 class="section-title">Why I built this?</h2>
      <p>
        While I was looking for a job, I noticed how inhumane job searching
        experience become. You send dozens of cold applications and month later
        get rejection. You do one or more interviews and get no response
        afterwards. References from peers I was working with is the only
        efficient way to reach recruiters.
      </p>
      <p>
        To make this experience better I built weareonhire! where you can write
        your story, fill resume and ask for recommendations. Now companies and
        recruiters can see more about candidates than job matching score number.
      </p>
      <p>
        <a class="link" target="_blank" href="/profile/trysound.io">
          Bogdan Chadkin
        </a>
      </p>
    </section>

    <section
      id="atmosphere"
      aria-label="What is atmosphere?"
      class="margin-trim-block"
    >
      <h2 class="section-title">What is the Atmosphere?</h2>
      <p>
        weareonhire! is part of the Atmosphere — the ecosystem of interconnected
        apps built on the
        <a class="link" target="_blank" href="https://atproto.com/">
          AT Protocol
        </a>
        — an open standard for decentralized social networking. Your account works
        across multiple apps: use your existing
        <a class="link" target="_blank" href="https://bsky.app/">Bluesky</a>
        handle (like user.bsky.social) to sign in. You own your data, your social
        graph, and can move freely between apps like
        <a class="link" target="_blank" href="https://tangled.org/">Tangled</a>,
        <a class="link" target="_blank" href="https://leaflet.pub">Leaflet</a>,
        and more. Discover more apps in
        <a class="link" target="_blank" href="https://atstore.fyi/">ATStore</a>.
      </p>
    </section>

    <section
      id="publications"
      aria-label="How to add publications"
      class="margin-trim-block"
    >
      <h2 class="section-title">How to add publications?</h2>
      <p>
        WAOH! is retrieving publications from <a
          class="link"
          target="_blank"
          href="http://standard.site/"
        >
          standard.site
        </a>
        – a publishing platform for long-form content in Atmosphere ecosystem. You
        can publish your existing articles using
        <a class="link" target="_blank" href="https://sequoia.pub">Sequoia</a>
        CLI, write directly on
        <a class="link" target="_blank" href="https://leaflet.pub">Leaflet</a>,
        and other compatible services to share your work on the open social.
      </p>
    </section>

    <footer class="margin-trim-block">
      <h2 class="section-title">Get Involved</h2>
      <ContactCards />
    </footer>
  </main>
</div>

<style>
  .content {
    display: grid;
    gap: var(--space-8);
    text-wrap: pretty;
  }

  .hero-title {
    font-size: var(--font-size-3xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text);
    margin: 0 0 var(--space-4);
    letter-spacing: -0.02em;

    text-decoration-line: underline;
    text-decoration-thickness: 1px;
    text-decoration-color: var(--color-accent);
    text-underline-offset: 6px;

    @media (max-width: 640px) {
      font-size: var(--font-size-2xl);
    }
  }

  .section-title {
    text-transform: uppercase;
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text);
  }
</style>
