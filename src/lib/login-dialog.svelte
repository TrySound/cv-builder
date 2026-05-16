<script lang="ts">
  import { isAtIdentifierString } from "@atproto/lex";
  import { searchProfiles } from "$lib/search.remote";
  import Combobox from "$lib/combobox.svelte";

  let { redirectUrl }: { redirectUrl: string } = $props();

  // Login handle autocomplete state
  let loginHandleInput = $state("");
  let loginHandleQuery = $state("");
  let loginQueryTimeoutId = $state<undefined | ReturnType<typeof setTimeout>>();
  let loginFormElement: HTMLFormElement | undefined = $state(undefined);

  const loginSearchResults = $derived(
    loginHandleQuery.trim().length > 0
      ? searchProfiles({ q: loginHandleQuery })
      : undefined,
  );

  const isLoginSearchLoading = $derived(
    loginHandleQuery.length > 0 && loginSearchResults?.loading === true,
  );
  const isLoginSearchPending = $derived(
    loginQueryTimeoutId != undefined || isLoginSearchLoading,
  );

  const loginSearchOptions = $derived.by(() => {
    if (loginHandleQuery.length === 0) {
      return [];
    }
    return (
      loginSearchResults?.current?.results.map((result) => ({
        value: result.handle,
        handle: result.handle,
        displayName: result.displayName,
        avatar: result.avatar,
      })) ?? []
    );
  });

  function handleLoginHandleInput(value: string) {
    loginHandleInput = value;
    clearTimeout(loginQueryTimeoutId);
    loginQueryTimeoutId = setTimeout(() => {
      loginQueryTimeoutId = undefined;
      loginHandleQuery = value;
    }, 200);
  }

  function handleLoginHandleSelect(option: {
    value: string;
    handle: string;
    displayName?: string;
    avatar?: string;
  }) {
    loginHandleInput = option.handle;
    // Submit the form when an item is selected
    if (loginFormElement) {
      loginFormElement.requestSubmit();
    }
  }

  let submittingSignIn = $state(false);
  let submittingSignUp = $state(false);

  const handleConnectSubmit = (event: SubmitEvent) => {
    const form = event.currentTarget as HTMLFormElement;
    const handle = form.elements.namedItem("handle") as HTMLInputElement;
    if (
      !isAtIdentifierString(handle.value) &&
      !handle.value.startsWith("https://")
    ) {
      event.preventDefault();
      handle.setCustomValidity(
        "Please enter a valid handle, DID, or a full PDS URL",
      );
      handle.reportValidity();
    } else {
      submittingSignIn = true;
    }
  };
</script>

<div popover id="login-dialog" class="popover login-popover">
  <div class="form-stack">
    <h2 class="body login-text">
      Sign in to <strong>weareonhire.com</strong> with
      <strong>Atmosphere</strong>
    </h2>

    <details class="form-group details">
      <summary class="subtle link">What is Atmosphere?</summary>
      <p class="login-text">
        The Atmosphere is the ecosystem of interconnected apps built on the AT
        Protocol — an open standard for decentralized social networking. Your
        account works across multiple apps: use your existing <a
          class="link"
          target="_blank"
          href="https://bsky.app/">Bluesky</a
        >
        handle (like user.bsky.social) to sign in. You own your data, your social
        graph, and can move freely between apps like
        <a class="link" target="_blank" href="https://tangled.org/">Tangled</a>,
        <a class="link" target="_blank" href="https://leaflet.pub">Leaflet</a>,
        and more. Discover more apps in
        <a class="link" target="_blank" href="https://atstore.fyi/">ATStore</a>
      </p>
    </details>

    <form
      bind:this={loginFormElement}
      class="form-stack"
      method="get"
      action="/auth/login"
      onsubmit={handleConnectSubmit}
    >
      <input type="hidden" name="prompt" value="login" />
      <input type="hidden" name="redirect" value={redirectUrl} />
      <div class="form-group">
        <label for="login-dialog-handle" class="form-label">Handle</label>
        <Combobox
          id="login-dialog-handle"
          bind:value={loginHandleInput}
          options={loginSearchOptions}
          placeholder="e.g., user.bsky.social"
          loading={isLoginSearchPending}
          oninput={handleLoginHandleInput}
          onselect={handleLoginHandleSelect}
          onfocus={() => {}}
          onblur={() => {}}
        >
          {#snippet optionSnippet(option)}
            <div class="search-result-item">
              {#if option.avatar}
                <img src={option.avatar} alt="" class="search-result-avatar" />
              {:else}
                <div class="search-result-avatar-placeholder"></div>
              {/if}
              <div class="search-result-info">
                {#if option.displayName}
                  <div class="truncate">{option.displayName}</div>
                {/if}
                <div class="subtle truncate">@{option.handle}</div>
              </div>
            </div>
          {/snippet}
        </Combobox>
        <input type="hidden" name="handle" value={loginHandleInput} />
      </div>
      <button
        class="button button-primary"
        data-state={submittingSignIn ? "loading" : undefined}
      >
        Continue
      </button>
    </form>

    <hr class="separator" />

    <form
      method="get"
      action="/auth/login"
      class="form-stack"
      onsubmit={() => (submittingSignUp = true)}
    >
      <input type="hidden" name="prompt" value="create" />
      <input type="hidden" name="redirect" value={redirectUrl} />
      <button
        class="button"
        data-state={submittingSignUp ? "loading" : undefined}
      >
        Create a new account
      </button>
    </form>
  </div>
</div>

<style>
  .login-popover {
    position-anchor: --topbar;
    position-area: bottom span-left;
    width: 360px;
    max-width: anchor-size(width);
    padding: var(--space-3);
  }

  /* prevents details-content affecting grid gap */
  .details:not([open])::details-content {
    display: none;
  }

  .login-text {
    margin: 0;
  }

  .search-result-item {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: var(--space-3);
    align-items: center;
    padding: var(--space-2) 0;
  }

  .search-result-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
  }

  .search-result-avatar-placeholder {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background-color: var(--color-border);
  }

  .search-result-info {
    display: grid;
  }
</style>
