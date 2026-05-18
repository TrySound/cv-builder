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
</script>

<div popover id="login-dialog" class="popover login-popover">
  <div class="margin-trim-block">
    <h2 class="body">
      Sign in to <strong>weareonhire.com</strong> with
      <strong><a class="link" href="/about#atmosphere">Atmosphere</a></strong>
    </h2>

    <form
      bind:this={loginFormElement}
      class="form-stack"
      method="get"
      action="/auth/login"
      onsubmit={() => (submittingSignIn = true)}
    >
      <input type="hidden" name="prompt" value="login" />
      <input type="hidden" name="redirect" value={redirectUrl} />
      <div class="form-group">
        <label for="login-dialog-handle" class="form-label">
          Atmosphere Account
        </label>
        <Combobox
          id="login-dialog-handle"
          bind:value={loginHandleInput}
          options={loginSearchOptions}
          autofocus
          name="handle"
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
      </div>
      <button
        class="button button-primary"
        data-state={submittingSignIn ? "loading" : undefined}
      >
        Sign in
      </button>
    </form>

    <form
      id="login-dialog-signup"
      method="get"
      action="/auth/login"
      onsubmit={() => (submittingSignUp = true)}
      hidden
    >
      <input type="hidden" name="prompt" value="create" />
      <input type="hidden" name="redirect" value={redirectUrl} />
    </form>

    <p>
      Don't have an account?
      <button form="login-dialog-signup" class="link">
        Create an account.
      </button>
    </p>

    <!--<details class="form-group details">
        <summary class="link">What is the Atmosphere?</summary>
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
          <a class="link" target="_blank" href="https://tangled.org/">Tangled</a
          >,
          <a class="link" target="_blank" href="https://leaflet.pub">Leaflet</a
          >, and more. Discover more apps in
          <a class="link" target="_blank" href="https://atstore.fyi/">ATStore</a
          >
        </p>
      </details>-->
  </div>
</div>

<style>
  .login-popover {
    position-anchor: --topbar;
    position-area: bottom span-left;
    width: 380px;
    max-width: anchor-size(width);
    padding: var(--space-4);
  }

  .search-result-item {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: var(--space-3);
    align-items: center;
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
