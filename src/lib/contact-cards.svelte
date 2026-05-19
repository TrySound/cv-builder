<script lang="ts"></script>

<div class="card-grid">
  <a class="button" target="_blank" href="https://repo.weareonhire.com">
    <div class="card-item margin-trim-block">
      <p>
        <svg width="32" height="32">
          <use href="#icon-github" />
        </svg>
      </p>
      <h3 class="heading-2">Contribute</h3>
      <p class="subtle">Help us build weareonhire!</p>
      <p>View on GitHub</p>
    </div>
  </a>
  <a class="button" target="_blank" href="https://chat.weareonhire.com">
    <div class="card-item margin-trim-block">
      <p>
        <svg width="32" height="32">
          <use href="#icon-discord" />
        </svg>
      </p>
      <h3 class="heading-2">Join the Community</h3>
      <p class="subtle">Chat, ask questions, and share ideas.</p>
      <p>Join Discord</p>
    </div>
  </a>
  <a class="button" target="_blank" href="https://social.weareonhire.com">
    <div class="card-item margin-trim-block">
      <p>
        <svg width="32" height="32">
          <use href="#icon-bluesky" />
        </svg>
      </p>
      <h3 class="heading-2">Stay Updated</h3>
      <p class="subtle">Get the latest updates and announcements.</p>
      <p>Follow on Bluesky</p>
    </div>
  </a>
</div>

<style>
  .card-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .card-grid {
    display: grid;
    gap: var(--space-8);
    @media (max-width: 640px) {
      grid-template-columns: 1fr;
    }
  }

  .card-item {
    text-align: center;
    padding: var(--space-4);
  }
</style>
