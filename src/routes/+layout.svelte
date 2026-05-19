<script module lang="ts">
  import { startKeyUX, focusGroupKeyUX } from "keyux";
  import { browser } from "$app/environment";
  import "../app.css";

  if (browser) {
    import("@oddbird/popover-polyfill");
    import("invokers-polyfill");
    import("dialog-closedby-polyfill");
    startKeyUX(window, [focusGroupKeyUX()]);
  }
</script>

<slot />
