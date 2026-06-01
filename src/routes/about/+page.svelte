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

  <main class="prose">
    <section aria-label="About weareonhire">
      <h1>About weareonhire!</h1>

      <p>
        An open social network where members maintain verified,
        recommendation-backed profiles. Think of it as a living resume that
        grows with your network — your professional reputation, backed by real
        people.
      </p>
    </section>

    <section aria-label="Why it was built?">
      <h2>Why I built this?</h2>
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
        <a target="_blank" href="/profile/trysound.io"> Bogdan Chadkin </a>
      </p>
    </section>

    <section id="atmosphere" aria-label="What is atmosphere?">
      <h2>What is the Atmosphere?</h2>
      <p>
        weareonhire! is part of the Atmosphere — the ecosystem of interconnected
        apps built on the
        <a target="_blank" href="https://atproto.com/"> AT Protocol </a>
        — an open standard for decentralized social networking. Your account works
        across multiple apps: use your existing
        <a target="_blank" href="https://bsky.app/">Bluesky</a>
        handle (like user.bsky.social) to sign in. You own your data, your social
        graph, and can move freely between apps like
        <a target="_blank" href="https://tangled.org/">Tangled</a>,
        <a target="_blank" href="https://leaflet.pub">Leaflet</a>, and more.
        Discover more apps in
        <a target="_blank" href="https://atstore.fyi/">ATStore</a>.
      </p>
    </section>

    <section id="publications" aria-label="How to add publications">
      <h2>How to add publications?</h2>
      <p>
        WAOH! is retrieving publications from <a
          target="_blank"
          href="http://standard.site/"
        >
          standard.site
        </a>
        – a publishing platform for long-form content in Atmosphere ecosystem. You
        can publish your existing articles using
        <a target="_blank" href="https://sequoia.pub">Sequoia</a>
        CLI, write directly on
        <a target="_blank" href="https://leaflet.pub">Leaflet</a>, and other
        compatible services to share your work on the open social.
      </p>
    </section>
  </main>

  <footer>
    <h2 class="text-heading-2">Get Involved</h2>
    <ContactCards />
  </footer>
</div>
