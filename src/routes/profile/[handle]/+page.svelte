<script lang="ts">
  import countries from "i18n-iso-countries";
  import countriesEnLocale from "i18n-iso-countries/langs/en.json";
  import { page } from "$app/state";
  import Topbar from "$lib/topbar.svelte";
  import {
    getProfile,
    getProfileContacts,
    updateProfile,
  } from "$lib/profile.remote";
  import { getPublications } from "$lib/publication.remote";
  import {
    getProfileRecommendations,
    createRecommendation as createRecommendationRaw,
  } from "$lib/recommendation.remote";
  import type { DatabaseSchema } from "$lib/db";
  import MultiSelectCombobox from "$lib/multi-select-combobox.svelte";
  import { getLinkDisplayName, getLinkIcon } from "$lib/link";
  import { formatDate } from "$lib/date.js";

  let { data } = $props();

  // await triggers reactivity loss warning but does not blink on the page
  const profile = $derived(await getProfile({ handle: data.profile.handle }));

  // SEO metadata
  const profileName = $derived(profile.name ?? data.profile.handle);
  const profileDescription = $derived(
    `View ${profileName}'s professional profile on weareonhire!`,
  );
  const seoTitle = $derived(
    profile.title
      ? `${profileName} - ${profile.title} | weareonhire!`
      : `${profileName} | weareonhire!`,
  );
  const personSchema = $derived({
    "@context": "https://schema.org",
    "@type": "Person",
    name: profileName,
    identifier: data.profile.handle,
    jobTitle: profile.title ?? undefined,
    description: profileDescription,
    url: `https://weareonhire.com/profile/${data.profile.handle}`,
    sameAs: [`https://bsky.app/profile/${data.profile.handle}`],
  });

  countries.registerLocale(countriesEnLocale);

  const countriesList = Object.entries(
    countries.getNames("en", { select: "alias" }),
  )
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const isProfileOwner = $derived(data.handle === data.profile.handle);

  // reset the form instantly hidden after submission
  const createRecommendation = $derived(
    createRecommendationRaw.for(data.profile.handle),
  );

  const recommendations = $derived(
    // await triggers reactivity loss warning but does not blink on the page
    await getProfileRecommendations({ handle: data.profile.handle }),
  );

  const contacts = $derived(
    await getProfileContacts({ handle: data.profile.handle }),
  );

  const publicationsLimit = 4;

  const publications = $derived(
    await getPublications({
      author: data.profile.handle,
      limit: publicationsLimit,
    }),
  );

  // Track which recommendation is currently targeted via URL hash
  const targetedId = $derived(page.url.hash.slice(1));

  // Local state for contacts to bind with MultiSelectCombobox
  let editingContacts = $state<{ value: string; label: string }[]>([]);

  let isEditing = $state(false);

  const startEditing = () => {
    isEditing = true;
    editingContacts = contacts.contacts.map((item) => ({
      value: item.rkey,
      label: item.url,
    }));
  };

  type ContactOperation =
    | { op: "add"; value: string }
    | { op: "delete"; value: string };

  // Generate contact operations from diff between original and edited contacts
  // editingContacts uses { value: rkey | new-id, label: url }
  const contactOperations = $derived.by(() => {
    const originalContacts = contacts.contacts ?? [];
    const originalRkeys = new Set(originalContacts.map((item) => item.rkey));
    const editingRkeys = new Set(editingContacts.map((c) => c.value));
    const operations: ContactOperation[] = [];

    // Find deleted contacts (present in original but not in editing)
    for (const contact of originalContacts) {
      if (!editingRkeys.has(contact.rkey)) {
        operations.push({ op: "delete", value: contact.rkey });
      }
    }

    // Find added contacts (new-* IDs in editing)
    for (const item of editingContacts) {
      if (!originalRkeys.has(item.value)) {
        operations.push({ op: "add", value: item.label });
      }
    }

    return operations;
  });

  type ProfileStatus = DatabaseSchema["profile_private"]["status"];

  const getStatusLabel = (status: ProfileStatus | undefined) => {
    switch (status) {
      case "open_to_work":
        return "Open to work";
      case "hidden":
        return "Hidden";
      default:
        status satisfies "open_to_connect" | undefined;
        return "Open to connect";
    }
  };
</script>

<svelte:head>
  <title>{seoTitle}</title>
  <meta name="description" content={profileDescription} />

  <!-- Open Graph -->
  <meta property="og:title" content={seoTitle} />
  <meta property="og:description" content={profileDescription} />
  <meta property="og:type" content="profile" />
  <meta property="og:url" content={page.url.toString()} />
  <meta property="og:image" content="{page.url.origin}/og-image.png" />
  <meta property="profile:username" content={data.profile.handle} />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={seoTitle} />
  <meta name="twitter:description" content={profileDescription} />
  <meta name="twitter:image" content="{page.url.origin}/og-image.png" />

  <!-- Structured Data -->
  {@html `<script type="application/ld+json">${JSON.stringify(personSchema)}</script>`}
</svelte:head>

<div class="container">
  <Topbar handle={data.handle} />

  <!-- editor -->
  <section
    class="profile-container"
    aria-label="Edit profile"
    hidden={!isEditing}
  >
    <div class="row">
      <div><!-- skip column --></div>

      <form
        class="form-stack"
        {...updateProfile.enhance(async ({ submit }) => {
          await submit();
          isEditing = false;
          // avoid resetting the form to not erase textarea initial value
        })}
      >
        <div class="form-group">
          <label for="profile-name" class="form-label">Name</label>
          <input
            id="profile-name"
            class="form-input"
            placeholder="Your full name"
            {...updateProfile.fields.name.as("text", profile.name ?? "")}
          />
        </div>

        <div class="form-grid">
          <div class="form-group">
            <label for="profile-title" class="form-label">Title</label>
            <input
              id="profile-title"
              type="text"
              class="form-input"
              placeholder="e.g., Senior Full-Stack Engineer"
              {...updateProfile.fields.title.as("text", profile.title ?? "")}
            />
          </div>

          <div class="form-group">
            <label for="profile-status" class="form-label">Status</label>
            <select
              id="profile-status"
              class="form-input"
              {...updateProfile.fields.status.as(
                "select",
                profile.status ?? "hidden",
              )}
            >
              <option class="menuitem" value="open_to_work">Open to Work</option
              >
              <option class="menuitem" value="open_to_connect"
                >Open to Connect</option
              >
              <option class="menuitem" value="hidden">Hidden</option>
            </select>
          </div>
        </div>

        <div class="form-grid">
          <div class="form-group">
            <label for="profile-email" class="form-label">Email</label>
            <input
              id="profile-email"
              class="form-input"
              placeholder="your@email.com"
              {...updateProfile.fields.email.as("email", profile.email ?? "")}
            />
          </div>

          <div class="form-group">
            <label for="profile-location" class="form-label">Location</label>
            <select
              id="profile-location"
              class="form-input"
              {...updateProfile.fields.countryCode.as(
                "select",
                profile.countryCode ?? "",
              )}
            >
              <option class="menuitem" value="">Worldwide</option>
              {#each countriesList as country}
                <option class="menuitem" value={country.code}>
                  {country.name}
                </option>
              {/each}
            </select>
          </div>
        </div>

        <div class="form-group">
          <label for="profile-contacts" class="form-label">Contacts</label>
          <MultiSelectCombobox
            id="profile-contacts"
            options={[]}
            allowCustom
            placeholder="Add URL (e.g., https://github.com/username)"
            bind:selected={editingContacts}
          />
          <!-- Hidden inputs to submit contact operations -->
          {#each contactOperations as operation, i}
            <input
              type="hidden"
              name="contactOperations[{i}].op"
              value={operation.op}
            />
            <input
              type="hidden"
              name="contactOperations[{i}].value"
              value={operation.value}
            />
          {/each}
        </div>

        <div class="form-group">
          <label for="profile-introduction" class="form-label">
            Introduction
          </label>
          <textarea
            id="profile-introduction"
            class="form-input"
            placeholder="Tell us your story..."
            {...updateProfile.fields.introduction.as(
              "text",
              profile.introduction ?? "",
            )}
          ></textarea>
        </div>

        <div class="form-actions">
          <button
            type="submit"
            class="button"
            data-state={updateProfile.pending ? "loading" : "idle"}
          >
            Save Profile
          </button>
          <button
            type="button"
            class="button"
            onclick={() => (isEditing = false)}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  </section>

  <!-- preview -->
  <section class="profile-container" aria-label="Profile" hidden={isEditing}>
    <div class="row profile-name-row">
      <div><!-- skip column --></div>
      <div class="margin-trim-block">
        <div class="space-between">
          <h2 class="heading-1">{profile.name ?? data.profile.handle}</h2>
          {#if isProfileOwner}
            <button
              class="icon-button"
              aria-label="Edit profile"
              onclick={startEditing}
            >
              <svg width="16" height="16">
                <use href="#icon-pencil" />
              </svg>
            </button>
          {/if}
        </div>
        <p class="subtle">{profile.title}</p>
        <p class="subtle">
          {#if profile.status}
            <span class="chip">
              {getStatusLabel(profile.status)}
              <svg width="14" height="14"><use href="#icon-check" /></svg>
            </span>
          {/if}
          <span class="chip">
            {#if profile.countryCode}
              {countries.getName(profile.countryCode, "en", {
                select: "alias",
              })}
            {:else}
              Worldwide
            {/if}
            <svg width="14" height="14"><use href="#icon-location" /></svg>
          </span>
        </p>
      </div>
    </div>

    <div class="row">
      <div class="subtle">
        <a href="/resume/{data.profile.handle}" class="link contact-item">
          View Resume
          <svg width="14" height="14"><use href="#icon-print" /></svg>
        </a>
        {#if profile.email}
          <a href="mailto:{profile.email}" class="link contact-item">
            Email
            <svg width="14" height="14"><use href="#icon-email" /></svg>
          </a>
        {/if}
        <a
          href="https://bsky.app/profile/{data.profile.handle}"
          target="_blank"
          class="link contact-item"
        >
          Bluesky
          <svg width="14" height="14"><use href="#icon-bluesky" /></svg>
        </a>
        {#each contacts.contacts as contact}
          <a href={contact.url} target="_blank" class="link contact-item">
            {getLinkDisplayName(contact.url)}
            <svg width="14" height="14">
              <use href="#icon-{getLinkIcon(contact.url)}" />
            </svg>
          </a>
        {/each}
      </div>
      <div class="margin-trim-block">
        <p
          class="white-space-preserve-line overflow-wrap-anywhere"
          class:subtle={!profile.introduction}
        >
          {profile.introduction ??
            `${data.profile.handle} hasn't shared his story yet`}
        </p>
      </div>
    </div>
  </section>

  <!-- Publications Section -->
  {#if publications.publications.length > 0 || isProfileOwner}
    <section class="publications-section" aria-label="Recent articles">
      <div class="row">
        <div><!-- skip column --></div>
        <div class="space-between">
          <h2 class="heading-2 subtle">Publications</h2>
          {#if isProfileOwner}
            <a
              class="icon-button"
              aria-label="Add publication"
              href="/about#publications"
              target="_blank"
            >
              <svg width="16" height="16">
                <use href="#icon-plus" />
              </svg>
            </a>
          {/if}
        </div>
      </div>

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
      {#if publications.publications.length === 0}
        <div class="row">
          <div><!-- skip column --></div>
          <div>
            <div class="subtle">You have not published anything yet</div>
          </div>
        </div>
      {/if}
      {#if publications.publications.length >= publicationsLimit}
        <div class="row">
          <div><!-- skip column --></div>
          <div>
            <a
              href="/publications?author={data.profile.handle}"
              class="link subtle"
            >
              Read all
            </a>
          </div>
        </div>
      {/if}
    </section>
  {/if}

  <!-- Recommendations Section -->
  <section
    class="recommendations-section"
    aria-label="Recommendations from other members"
  >
    <div class="row">
      <div><!-- skip column --></div>
      <h2 class="heading-2 subtle">Recommendations</h2>
    </div>

    <!-- Write Recommendation Form -->
    {#if !isProfileOwner && !recommendations.isRecommendedByMe && data.handle}
      <div class="row">
        <div><!-- skip column --></div>
        <form {...createRecommendation} class="form-stack">
          <input
            {...createRecommendation.fields.handle.as(
              "hidden",
              data.profile.handle,
            )}
          />
          <div class="form-group">
            <label for="recommendation-input" class="form-label">
              Write a recommendation
              <span class="character-count">
                {createRecommendation.fields.reason.value()?.length ?? 0} / 200 characters
              </span>
            </label>
            <textarea
              id="recommendation-input"
              rows="6"
              class="form-input"
              placeholder="Write your recommendation here..."
              minlength="200"
              {...createRecommendation.fields.reason.as("text")}
            ></textarea>
          </div>
          <div>
            <button
              class="button"
              data-state={createRecommendation.pending ? "loading" : "idle"}
            >
              Post
            </button>
          </div>
        </form>
      </div>
    {/if}

    <div>
      {#each recommendations.recommendations as item}
        <article
          id="recommendation-{item.id}"
          class="row recommendation"
          class:active={targetedId === `recommendation-${item.id}`}
        >
          <div>
            <time class="subtle" datetime={item.createdAt}>
              {item.createdAtFormatted}
            </time>
          </div>
          <div class="margin-trim-block">
            <p class="subtle">
              <a href="/profile/{item.authorHandle}" class="link">
                {item.authorName || item.authorHandle}
              </a>
            </p>
            <p class="overflow-wrap-anywhere">
              {item.reason}
            </p>
          </div>
        </article>
      {:else}
        <div class="row">
          <div><!-- skip column --></div>
          <div class="margin-trim-block">
            <p class="subtle">The user has not been recommended yet</p>
          </div>
        </div>
      {/each}
    </div>
  </section>
</div>

<style>
  .container {
    @media print {
      display: none;
    }
  }

  .profile-container {
    margin-bottom: var(--space-12);
  }

  .profile-name-row {
    margin-bottom: var(--space-4);
  }

  .contact-item {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    justify-content: end;
    @media (max-width: 640px) {
      flex-direction: row-reverse;
      justify-content: start;
    }
  }

  .recommendations-section {
    display: grid;
    gap: var(--space-3);
  }

  .character-count {
    float: right;
  }

  .recommendation {
    padding: var(--space-4) var(--space-4);
    margin: 0 calc(var(--space-4) * -1);
    &.active {
      background-color: var(--color-bg-hover);
    }
  }

  .publications-section {
    display: grid;
    gap: var(--space-8);
    margin-bottom: var(--space-12);
  }
</style>
