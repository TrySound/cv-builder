<script lang="ts">
  import type { Resume } from "$lib/jsonresume";
  import countries from "i18n-iso-countries";
  import countriesEnLocale from "i18n-iso-countries/langs/en.json";
  import { page } from "$app/state";
  import Topbar from "$lib/topbar.svelte";
  import UploadResumeDialog from "$lib/upload-resume-dialog.svelte";
  import { getProfileRecommendations } from "$lib/recommendation.remote";
  import {
    getMemberProfile,
    getProfileContacts,
    getResumeBasics,
    updateMemberProfile,
    updateResumeBasics,
  } from "$lib/profile.remote";
  import { formatDate } from "$lib/date";
  import { getLinkDisplayName, getLinkIcon } from "$lib/link";
  import MultiSelectCombobox from "../../../multi-select-combobox.svelte";
  import Editor from "../../../editor.svelte";
  import Print from "../../../print.svelte";

  countries.registerLocale(countriesEnLocale);

  const countriesList = Object.entries(
    countries.getNames("en", { select: "alias" }),
  )
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  let { data } = $props();

  const basicProfile = $derived(
    await getResumeBasics({ handle: data.profile.handle }),
  );

  // SEO metadata
  const profileName = $derived(basicProfile.name ?? data.profile.handle);
  const profileDescription = $derived(
    `View ${profileName}'s professional profile on weareonhire!`,
  );
  const seoTitle = $derived(
    basicProfile.title
      ? `${profileName} - ${basicProfile.title} | weareonhire!`
      : `${profileName} | weareonhire!`,
  );
  const personSchema = $derived({
    "@context": "https://schema.org",
    "@type": "Person",
    name: profileName,
    identifier: data.profile.handle,
    jobTitle: basicProfile.title ?? undefined,
    description: profileDescription,
    url: `https://weareonhire.com/profile/${data.profile.handle}`,
    sameAs: [`https://bsky.app/profile/${data.profile.handle}`],
  });

  const isOwnProfile = $derived(data.handle === data.profile.handle);

  // Load resume via remote query
  const profile = $derived(getMemberProfile({ handle: data.profile.handle }));

  // Load contacts via remote query
  const contacts = $derived(
    getProfileContacts({ handle: data.profile.handle }),
  );

  // Load recommendations via remote query
  const recommendations = $derived(
    getProfileRecommendations({ handle: data.profile.handle }),
  );

  let saveMessage = $state("");

  // State for editing basics
  let isEditingBasics = $state(false);
  let editingContacts = $state<string[]>([]);

  async function handleSave(resume: Resume) {
    saveMessage = "";
    // optimistically update resume before mutation
    profile.set(resume);
    try {
      await updateMemberProfile(resume);
      // Query will be refreshed automatically by the command
    } catch (e: any) {
      saveMessage = e.message || "Failed to save profile";
    }
  }

  function startEditingBasics() {
    isEditingBasics = true;
    editingContacts = (contacts.current?.contacts ?? []).map(
      (item) => item.url,
    );
  }
  type ContactOperation =
    | { op: "add"; value: string }
    | { op: "delete"; value: string };

  // Generate contact operations from diff between original and edited contacts
  const contactOperations = $derived.by(() => {
    const originalContacts = contacts.current?.contacts ?? [];
    const originalUrls = new Set(originalContacts.map((c) => c.url));
    const editingUrls = new Set(editingContacts);
    const operations: ContactOperation[] = [];
    // Find deleted contacts
    for (const contact of originalContacts) {
      if (!editingUrls.has(contact.url)) {
        operations.push({ op: "delete", value: contact.rkey });
      }
    }
    // Find added contacts
    for (const url of editingUrls) {
      if (!originalUrls.has(url)) {
        operations.push({ op: "add", value: url });
      }
    }
    return operations;
  });
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

  <!-- Contacts and Summary Section -->

  <!-- Editor -->
  <section
    class="cv-section"
    aria-label="Edit contacts and summary"
    hidden={!isEditingBasics}
  >
    <div class="row">
      <div><!-- skip column --></div>
      <form
        class="form-stack"
        {...updateResumeBasics.enhance(async ({ submit }) => {
          await submit();
          isEditingBasics = false;
          // avoid resetting the form to not erase textarea initial value
        })}
      >
        <div class="form-grid">
          <div class="form-group">
            <label for="contact-name" class="form-label">Name</label>
            <input
              id="contact-name"
              placeholder="John Doe"
              class="form-input"
              {...updateResumeBasics.fields.name.as(
                "text",
                basicProfile.name ?? "",
              )}
            />
          </div>
          <div class="form-group">
            <label for="contact-location" class="form-label">Location</label>
            <select
              id="contact-location"
              class="form-input"
              {...updateResumeBasics.fields.countryCode.as(
                "select",
                basicProfile.countryCode ?? "",
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
          <div class="form-group">
            <label for="contact-email" class="form-label">Email</label>
            <input
              id="contact-email"
              placeholder="john@example.com"
              class="form-input"
              {...updateResumeBasics.fields.email.as(
                "email",
                basicProfile.email ?? "",
              )}
            />
          </div>
          <div class="form-group">
            <label for="contact-title" class="form-label">Title</label>
            <input
              id="contact-title"
              placeholder="Senior Software Engineer at TechCorp"
              class="form-input"
              {...updateResumeBasics.fields.title.as(
                "text",
                basicProfile.title ?? "",
              )}
            />
          </div>
        </div>
        <div class="form-group">
          <label for="profile-contacts" class="form-label">Contacts</label>
          <MultiSelectCombobox
            id="profile-contacts"
            options={[]}
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
          <label for="contact-summary" class="form-label">
            Short Summary
          </label>
          <textarea
            id="contact-summary"
            rows="4"
            placeholder="Brief professional summary..."
            class="form-input"
            {...updateResumeBasics.fields.summary.as(
              "text",
              basicProfile.summary ?? "",
            )}
          ></textarea>
        </div>

        <div class="form-actions">
          <button
            type="submit"
            class="button"
            data-state={updateResumeBasics.pending ? "loading" : "idle"}
          >
            Save Profile
          </button>
          <button
            type="button"
            class="button"
            onclick={() => (isEditingBasics = false)}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  </section>

  <!-- Preview -->

  <section
    class="cv-section"
    aria-label="Contacts and summary"
    hidden={isEditingBasics}
  >
    <div class="row name-row">
      <div><!-- skip column --></div>
      <div class="margin-trim-block">
        <div class="space-between">
          <h2 class="heading-1">
            {basicProfile.name || "Your Name"}
          </h2>
          <div class="actions">
            {#if isOwnProfile}
              <button
                type="button"
                class="icon-button"
                aria-label="Upload resume"
                commandfor="upload-resume-dialog"
                command="show-modal"
              >
                <svg width="20" height="20">
                  <use href="#icon-upload" />
                </svg>
              </button>
            {/if}
            <button
              type="button"
              class="icon-button"
              aria-label="Print resume"
              onclick={() => window.print()}
            >
              <svg width="20" height="20">
                <use href="#icon-print" />
              </svg>
            </button>
            {#if isOwnProfile}
              <button
                class="icon-button"
                aria-label="Edit contacts and summary"
                onclick={startEditingBasics}
              >
                <svg width="16" height="16">
                  <use href="#icon-pencil" />
                </svg>
              </button>
            {/if}
          </div>
        </div>
        {#if basicProfile.title}
          <p class="subtle">{basicProfile.title}</p>
        {/if}
        <p class="subtle">
          <span class="chip">
            {#if basicProfile.countryCode}
              {countries.getName(basicProfile.countryCode, "en", {
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
        {#if basicProfile.email}
          <a href="mailto:{basicProfile.email}" class="link contact-item">
            Email
            <svg width="14" height="14"><use href="#icon-email" /></svg>
          </a>
        {/if}
        {#each contacts.current?.contacts as contact}
          <a href={contact.url} target="_blank" class="link contact-item">
            {getLinkDisplayName(contact.url)}
            <svg width="14" height="14">
              <use href="#icon-{getLinkIcon(contact.url)}" />
            </svg>
          </a>
        {/each}
      </div>
      <div class="margin-trim-block">
        {#if basicProfile.summary}
          <p class="white-space-preserve-line">{basicProfile.summary}</p>
        {:else}
          <p class="subtle">
            Add a professional summary to describe your background and
            expertise.
          </p>
        {/if}
      </div>
    </div>
  </section>

  <div class="editor-container">
    {#if profile.current}
      <Editor
        resume={profile.current}
        onSave={handleSave}
        readonly={!isOwnProfile}
      />
    {:else}
      <div class="spinner-container">
        <div class="spinner"></div>
        <span class="subtle">Loading profile...</span>
      </div>
    {/if}
  </div>

  <!-- Recommendations Section -->
  <section
    class="recommendations-section"
    aria-label="Recommendations from other members"
  >
    <div class="row">
      <div><!-- skip column --></div>
      <h2 class="heading-2 subtle">Recommendations</h2>
    </div>

    <div>
      {#each recommendations.current?.recommendations as item}
        <article id="recommendation-{item.id}" class="row recommendation">
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
            </p>
            <p>
              {item.reason}
            </p>
          </div>
        </article>
      {:else}
        {#if recommendations.ready}
          <div class="row">
            <div><!-- skip column --></div>
            <p class="subtle">The user has not been recommended yet</p>
          </div>
        {/if}
      {/each}
    </div>
  </section>
</div>

<UploadResumeDialog onUpload={handleSave} />

{#if profile.current}
  <Print resume={profile.current} />
{/if}

<style>
  .container {
    @media print {
      display: none;
    }
  }

  .name-row {
    margin-bottom: var(--space-4);
  }

  .cv-section {
    margin-bottom: var(--space-12);
  }

  .editor-container {
    margin-bottom: var(--space-8);
  }

  .recommendations-section {
    display: grid;
    gap: var(--space-8);
  }

  .recommendation {
    padding: var(--space-6) 0;
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
</style>
