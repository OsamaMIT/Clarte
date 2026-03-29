import ExplanationCard from "./lib/components/ExplanationCard.svelte";
import cardStyles from "./lib/styles.css?inline";
import { extractSelectionData } from "./lib/context";
import { generateExplanation } from "./lib/gemini";
import { detectSource } from "./lib/source";
import {
  getCachedExplanation,
  getSettings,
  makeCacheKey,
  putCachedExplanation
} from "./lib/storage";
import type {
  CardState,
  ExplainCardData,
  ExplainRequestContext,
  SelectionData,
  UserSettings
} from "./lib/types";
import { MESSAGE_EXPLAIN_CONTEXT } from "./lib/types";

const HOST_ID = "clarte-shadow-host";
const CARD_MARGIN = 12;
const CARD_WIDTH = 380;
const CARD_HEIGHT_ESTIMATE = 320;

interface ExplainSnapshot {
  selection: SelectionData;
  context: ExplainRequestContext;
  settings: UserSettings;
  cacheKey: string;
}

let hostElement: HTMLDivElement | null = null;
let cardComponent: ExplanationCard | null = null;
let cardData: ExplainCardData = {
  selectedText: "",
  state: "hidden",
  meaning: "",
  simplerVersion: "",
  confidence: null,
  errorMessage: "",
  position: { top: 16, left: 16 }
};

let latestRequestToken = 0;
let lastSnapshot: ExplainSnapshot | null = null;
let listenersAttached = false;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function clampCardPosition(position: { top: number; left: number }): { top: number; left: number } {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const cardWidth = Math.min(CARD_WIDTH, viewportWidth - CARD_MARGIN * 2);
  const maxTop = Math.max(CARD_MARGIN, viewportHeight - CARD_HEIGHT_ESTIMATE - CARD_MARGIN);
  const maxLeft = Math.max(CARD_MARGIN, viewportWidth - cardWidth - CARD_MARGIN);

  return {
    top: clamp(position.top, CARD_MARGIN, maxTop),
    left: clamp(position.left, CARD_MARGIN, maxLeft)
  };
}

function computeCardPosition(selection: SelectionData): { top: number; left: number } {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const cardWidth = Math.min(CARD_WIDTH, viewportWidth - CARD_MARGIN * 2);
  const maxTop = Math.max(CARD_MARGIN, viewportHeight - CARD_HEIGHT_ESTIMATE - CARD_MARGIN);

  let left = clamp(selection.rect.left, CARD_MARGIN, viewportWidth - cardWidth - CARD_MARGIN);
  let top = selection.rect.bottom + CARD_MARGIN;

  if (top + CARD_HEIGHT_ESTIMATE > viewportHeight - CARD_MARGIN) {
    top = selection.rect.top - CARD_HEIGHT_ESTIMATE - CARD_MARGIN;
  }

  top = clamp(top, CARD_MARGIN, maxTop);
  left = clamp(left, CARD_MARGIN, viewportWidth - cardWidth - CARD_MARGIN);

  return clampCardPosition({ top, left });
}

function ensureCardMounted(): void {
  if (cardComponent) {
    return;
  }

  hostElement = document.getElementById(HOST_ID) as HTMLDivElement | null;
  if (!hostElement) {
    hostElement = document.createElement("div");
    hostElement.id = HOST_ID;
    hostElement.style.position = "fixed";
    hostElement.style.inset = "0";
    hostElement.style.pointerEvents = "none";
    hostElement.style.zIndex = "2147483647";
    document.documentElement.appendChild(hostElement);
  }

  const shadowRoot = hostElement.shadowRoot ?? hostElement.attachShadow({ mode: "open" });
  if (!shadowRoot.querySelector("style[data-clarte-style='true']")) {
    const styleElement = document.createElement("style");
    styleElement.dataset.clarteStyle = "true";
    styleElement.textContent = cardStyles;
    shadowRoot.appendChild(styleElement);
  }

  let mountPoint = shadowRoot.getElementById("clarte-mount");
  if (!mountPoint) {
    mountPoint = document.createElement("div");
    mountPoint.id = "clarte-mount";
    shadowRoot.appendChild(mountPoint);
  }

  cardComponent = new ExplanationCard({
    target: mountPoint,
    props: {
      visible: false,
      ...cardData
    }
  });

  cardComponent.$on("close", () => {
    hideCard();
  });

  cardComponent.$on("retry", () => {
    void runExplainFlow(true);
  });

  cardComponent.$on("move", (event: CustomEvent<{ top: number; left: number }>) => {
    updateCard({
      position: clampCardPosition(event.detail)
    });
  });
}

function attachCloseListeners(): void {
  if (listenersAttached) {
    return;
  }

  document.addEventListener(
    "mousedown",
    (event) => {
      if (!cardComponent || cardData.state === "hidden" || !hostElement) {
        return;
      }
      const path = event.composedPath();
      if (path.includes(hostElement)) {
        return;
      }
      hideCard();
    },
    true
  );

  document.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Escape" && cardData.state !== "hidden") {
        hideCard();
      }
    },
    true
  );

  listenersAttached = true;
}

function updateCard(patch: Partial<ExplainCardData> & { visible?: boolean }): void {
  ensureCardMounted();
  attachCloseListeners();

  cardData = {
    ...cardData,
    ...patch
  };
  cardComponent?.$set({
    ...cardData,
    visible: patch.visible ?? cardData.state !== "hidden"
  });
}

function hideCard(): void {
  updateCard({
    state: "hidden",
    errorMessage: "",
    visible: false
  });
}

function showLoading(selection: SelectionData): void {
  updateCard({
    selectedText: selection.selectedText,
    meaning: "",
    simplerVersion: "",
    confidence: null,
    errorMessage: "",
    position: computeCardPosition(selection),
    state: "loading",
    visible: true
  });
}

function showSuccess(selection: SelectionData, payload: { meaning: string; simpler: string; confidence: number }): void {
  const state: CardState = payload.confidence >= 0.7 ? "success" : "low_confidence";
  updateCard({
    selectedText: selection.selectedText,
    meaning: payload.meaning,
    simplerVersion: payload.simpler,
    confidence: payload.confidence,
    errorMessage: "",
    position: computeCardPosition(selection),
    state,
    visible: true
  });
}

function showError(selection: SelectionData | null, errorMessage: string, isTimeout: boolean): void {
  updateCard({
    selectedText: selection?.selectedText ?? "No selected text",
    meaning: "",
    simplerVersion: "",
    confidence: null,
    errorMessage,
    position: selection
      ? computeCardPosition(selection)
      : {
          top: Math.max(CARD_MARGIN, Math.floor(window.innerHeight * 0.2)),
          left: CARD_MARGIN
        },
    state: isTimeout ? "timeout" : "error",
    visible: true
  });
}

async function buildSnapshotFromPage(): Promise<ExplainSnapshot | null> {
  const selection = extractSelectionData();
  if (!selection) {
    return null;
  }

  const pageUrl = window.location.href;
  const hostname = window.location.hostname;
  const pageTitle = document.title || hostname;
  const source = detectSource(hostname, pageUrl, pageTitle);
  const settings = await getSettings();

  const context: ExplainRequestContext = {
    selectedText: selection.selectedText,
    paragraphContext: selection.paragraphContext,
    pageTitle,
    pageUrl,
    hostname,
    sourceType: source.sourceType,
    domainHint: source.domainHint
  };

  const cacheKey = makeCacheKey({
    selectedText: selection.selectedText,
    paragraphContext: selection.paragraphContext,
    hostname,
    audienceMode: settings.audienceMode,
    verbosity: settings.verbosity
  });

  return {
    selection,
    context,
    settings,
    cacheKey
  };
}

async function runExplainFlow(fromRetry: boolean): Promise<void> {
  const requestToken = ++latestRequestToken;

  const snapshot = fromRetry ? lastSnapshot : await buildSnapshotFromPage();
  if (!snapshot) {
    showError(null, "Highlight text on the page, then run Explain Context.", false);
    return;
  }

  lastSnapshot = snapshot;
  showLoading(snapshot.selection);

  if (!fromRetry) {
    const cached = await getCachedExplanation(snapshot.cacheKey);
    if (requestToken !== latestRequestToken) {
      return;
    }
    if (cached) {
      showSuccess(snapshot.selection, {
        meaning: cached.result.meaning,
        simpler: cached.result.simpler_version,
        confidence: cached.result.confidence
      });
      return;
    }
  }

  const result = await generateExplanation(snapshot.context, snapshot.settings);
  if (requestToken !== latestRequestToken) {
    return;
  }

  if (!result.ok) {
    const timeout = result.errorCode === "timeout";
    showError(snapshot.selection, result.message, timeout);
    return;
  }

  showSuccess(snapshot.selection, {
    meaning: result.result.meaning,
    simpler: result.result.simpler_version,
    confidence: result.result.confidence
  });

  await putCachedExplanation({
    key: snapshot.cacheKey,
    createdAt: Date.now(),
    selectedText: snapshot.selection.selectedText,
    paragraphContext: snapshot.selection.paragraphContext,
    hostname: snapshot.context.hostname,
    audienceMode: snapshot.settings.audienceMode,
    verbosity: snapshot.settings.verbosity,
    result: result.result
  });
}

chrome.runtime.onMessage.addListener((message: { type?: string }) => {
  if (message?.type === MESSAGE_EXPLAIN_CONTEXT) {
    void runExplainFlow(false);
  }
});
