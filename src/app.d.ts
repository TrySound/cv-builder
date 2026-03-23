/// <reference types="svelte" />
/// <reference types="vite/client" />

import type { Agent } from "@atproto/api";

declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      agent?: Agent;
      did?: string;
    }
    // interface PageData {}
    // interface Platform {}
  }
}

export { };
