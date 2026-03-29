/// <reference types="svelte" />

declare module "*.svelte" {
  import type { SvelteComponentTyped } from "svelte";
  export default class Component extends SvelteComponentTyped<Record<string, unknown>, Record<string, unknown>, Record<string, unknown>> {}
}

declare module "*.css?inline" {
  const css: string;
  export default css;
}
