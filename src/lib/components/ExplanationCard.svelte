<script lang="ts">
  import { onDestroy } from "svelte";
  import { createEventDispatcher } from "svelte";
  import type { CardState, ExplanationOrder } from "../types";
  import Button from "./ui/button/button.svelte";
  import Badge from "./ui/badge/badge.svelte";

  export let visible = false;
  export let state: CardState = "hidden";
  export let selectedText = "";
  export let meaning = "";
  export let simplerVersion = "";
  export let explanationOrder: ExplanationOrder = "meaning_first";
  export let confidence: number | null = null;
  export let errorMessage = "";
  export let position = { top: 16, left: 16 };

  const dispatch = createEventDispatcher<{
    close: undefined;
    retry: undefined;
    move: { top: number; left: number };
  }>();

  $: isLoading = state === "loading";
  $: isSuccess = state === "success" || state === "low_confidence";
  $: isLowConfidence = state === "low_confidence";
  $: isError = state === "error" || state === "timeout";
  $: showMeaningFirst = explanationOrder === "meaning_first";

  let dragging = false;
  let dragPointerId: number | null = null;
  let dragStartPointerX = 0;
  let dragStartPointerY = 0;
  let dragStartTop = 0;
  let dragStartLeft = 0;
  let flagPressed = false;
  let showReviewNotice = false;
  let reviewNoticeTimer: ReturnType<typeof setTimeout> | null = null;

  function startDrag(event: PointerEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target || target.closest("button")) {
      return;
    }
    dragging = true;
    dragPointerId = event.pointerId;
    dragStartPointerX = event.clientX;
    dragStartPointerY = event.clientY;
    dragStartTop = position.top;
    dragStartLeft = position.left;
    event.preventDefault();
  }

  function moveDrag(event: PointerEvent): void {
    if (!dragging || dragPointerId !== event.pointerId) {
      return;
    }
    const dx = event.clientX - dragStartPointerX;
    const dy = event.clientY - dragStartPointerY;
    dispatch("move", {
      top: dragStartTop + dy,
      left: dragStartLeft + dx
    });
  }

  function endDrag(event: PointerEvent): void {
    if (dragPointerId !== event.pointerId) {
      return;
    }
    dragging = false;
    dragPointerId = null;
  }

  function setFlagPressed(value: boolean): void {
    flagPressed = value;
  }

  function handleFlagKeyDown(event: KeyboardEvent): void {
    if (event.key === "Enter" || event.key === " ") {
      flagPressed = true;
    }
  }

  function handleFlagKeyUp(event: KeyboardEvent): void {
    if (event.key === "Enter" || event.key === " ") {
      flagPressed = false;
    }
  }

  function triggerReviewNotice(): void {
    showReviewNotice = true;
    if (reviewNoticeTimer) {
      clearTimeout(reviewNoticeTimer);
    }
    reviewNoticeTimer = setTimeout(() => {
      showReviewNotice = false;
      reviewNoticeTimer = null;
    }, 1500);
  }

  onDestroy(() => {
    if (reviewNoticeTimer) {
      clearTimeout(reviewNoticeTimer);
    }
  });
</script>

<svelte:window
  on:pointermove={moveDrag}
  on:pointerup={(event) => {
    endDrag(event);
    setFlagPressed(false);
  }}
  on:pointercancel={(event) => {
    endDrag(event);
    setFlagPressed(false);
  }}
/>

{#if visible && state !== "hidden"}
  <div class="fixed inset-0 z-[2147483647] pointer-events-none">
    <article
      class="clarte-card-enter pointer-events-auto absolute w-[min(380px,calc(100vw-24px))] rounded-lg border border-border bg-card p-4 text-card-foreground shadow-card relative"
      style={`top:${position.top}px;left:${position.left}px;`}
    >
      {#if showReviewNotice}
        <div class="pointer-events-none absolute top-2 left-1/2 z-10 -translate-x-1/2 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-center text-[11px] font-medium text-amber-800 shadow-sm">
          Marked for review
        </div>
      {/if}

      <div class="clarity-scroll max-h-[min(75vh,560px)] overflow-auto pr-1">
        <header class="mb-3 flex items-start justify-between gap-3 cursor-move select-none" on:pointerdown={startDrag}>
          <div class="space-y-1">
            <p class="text-sm font-semibold">Clarity</p>
            <p class="text-xs text-muted-foreground">Context explanation</p>
          </div>
          <div class="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              class={`h-7 w-7 p-0 ${flagPressed ? "text-amber-600" : "text-muted-foreground hover:text-foreground"}`}
              aria-label="Feedback (coming soon)"
              title="Feedback (coming soon)"
              on:pointerdown={() => setFlagPressed(true)}
              on:pointerup={() => setFlagPressed(false)}
              on:pointercancel={() => setFlagPressed(false)}
              on:pointerleave={() => setFlagPressed(false)}
              on:keydown={handleFlagKeyDown}
              on:keyup={handleFlagKeyUp}
              on:blur={() => setFlagPressed(false)}
              on:click={triggerReviewNotice}
            >
              <span class="relative h-4 w-4">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class={`absolute inset-0 h-4 w-4 ${flagPressed ? "hidden" : "block"}`}
                  aria-hidden="true"
                >
                  <path d="M5 21V4" />
                  <path d="M5 5h11l-2 3 2 3H5" />
                </svg>
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  class={`absolute inset-0 h-4 w-4 ${flagPressed ? "block" : "hidden"}`}
                  aria-hidden="true"
                >
                  <path d="M5 21V4h1.5v1h10.1l-2 3 2 3H6.5V21z" />
                </svg>
              </span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              class="h-7 w-7 p-0"
              aria-label="Close explanation"
              on:click={() => dispatch("close")}
            >
              ×
            </Button>
          </div>
        </header>

        <div class="mb-3 rounded-md bg-secondary p-2">
          <p class="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Selected Text</p>
          <p class="mt-1 text-sm leading-snug">"{selectedText}"</p>
        </div>

        {#if isLoading}
          <div class="space-y-2">
            <div class="flex items-center gap-2 text-sm text-muted-foreground">
              <span class="inline-block h-3 w-3 animate-spin rounded-full border-2 border-muted-foreground border-r-transparent"></span>
              <span>Generating explanation…</span>
            </div>
          </div>
        {/if}

        {#if isSuccess}
          <div class="space-y-3">
            {#if isLowConfidence}
              <Badge variant="warning">Low confidence{#if confidence !== null}: {confidence.toFixed(2)}{/if}</Badge>
            {/if}

          {#if showMeaningFirst}
            <section class="space-y-1">
              <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Meaning</p>
              <p class="text-sm leading-relaxed">{meaning}</p>
            </section>

            <section class="space-y-1">
              <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Simpler Version</p>
              <p class="text-sm leading-relaxed">{simplerVersion}</p>
            </section>
          {:else}
            <section class="space-y-1">
              <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Simpler Version</p>
              <p class="text-sm leading-relaxed">{simplerVersion}</p>
            </section>

            <section class="space-y-1">
              <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Meaning</p>
              <p class="text-sm leading-relaxed">{meaning}</p>
            </section>
          {/if}

          </div>
        {/if}

        {#if isError}
          <div class="space-y-3">
            <p class="text-sm text-destructive">
              {state === "timeout" ? "Request timed out." : "Unable to generate explanation."}
            </p>
            <p class="text-xs text-muted-foreground">{errorMessage}</p>
            <Button variant="secondary" on:click={() => dispatch("retry")}>Retry</Button>
          </div>
        {/if}
      </div>
    </article>
  </div>
{/if}
