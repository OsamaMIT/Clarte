import { GoogleGenAI } from "@google/genai";
import type { ExplainRequestContext, GeminiCallResult, UserSettings } from "./types";
import { parseJsonSafely, validateGeminiOutput } from "./validate";

const MODEL_NAME = "gemma-3-27b-it"; // Gemma 3 27B
const REQUEST_TIMEOUT_MS = 20000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error("request_timeout"));
    }, timeoutMs);

    promise.then(
      (value) => {
        clearTimeout(timeoutId);
        resolve(value);
      },
      (error) => {
        clearTimeout(timeoutId);
        reject(error);
      }
    );
  });
}

function outputSchemaDescription(): string {
  return `{
  "meaning": "string",
  "simpler_version": "string",
  "confidence": number,
  "needs_more_context": boolean,
  "uncertainty_reason": "string"
}`;
}

function buildPrompt(context: ExplainRequestContext, settings: UserSettings): string {
  return [
    "You are Clarity, an assistant that explains highlighted text in context.",
    "Do not solely define the highlighted text, but always explain what it means in the context of the surrounding paragraph and page.",
    "Make sure the explanation is relevant to the user's likely intent of understanding the meaning of the text, why it's there, and how it connects to the rest of the content.",
    "Return strict JSON only.",
    "Do not use markdown fences.",
    "Do not add text before or after the JSON object.",
    "All required string fields must be non-empty.",
    "confidence must be a number from 0 to 1.",
    "Schema:",
    outputSchemaDescription(),
    "",
    "User settings:",
    `audience_mode: ${settings.audienceMode}`,
    `verbosity: ${settings.verbosity}`,
    `native_language: ${settings.nativeLanguage}`,
    `english_level: ${settings.englishLevel}`,
    `technical_familiarity: ${settings.technicalFamiliarity}`,
    "",
    "Page context:",
    `page_title: ${context.pageTitle}`,
    `page_url: ${context.pageUrl}`,
    `source_type: ${context.sourceType}`,
    `domain_hint: ${context.domainHint}`,
    "",
    "Selected text:",
    context.selectedText,
    "",
    "Local context:",
    context.paragraphContext
  ].join("\n");
}

function buildRepairPrompt(originalPrompt: string, invalidOutput: string, error: string): string {
  return [
    originalPrompt,
    "",
    "Your last output was invalid JSON or violated schema.",
    `Validation error: ${error}`,
    "Invalid output:",
    invalidOutput,
    "",
    "Rewrite your answer now as strict JSON only, matching the exact schema."
  ].join("\n");
}

function extractResponseText(response: unknown): string {
  if (!response || typeof response !== "object") {
    return "";
  }

  const directText = (response as { text?: unknown }).text;
  if (typeof directText === "string") {
    return directText;
  }
  if (typeof directText === "function") {
    const called = directText();
    if (typeof called === "string") {
      return called;
    }
  }

  const candidates = (response as { candidates?: unknown[] }).candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return "";
  }

  const firstCandidate = candidates[0] as {
    content?: {
      parts?: Array<{ text?: string }>;
    };
  };

  const parts = firstCandidate?.content?.parts;
  if (!Array.isArray(parts)) {
    return "";
  }

  return parts
    .map((part) => (typeof part.text === "string" ? part.text : ""))
    .join("")
    .trim();
}

function parseAndValidate(raw: string): { ok: true; value: ReturnType<typeof validateGeminiOutput> & { ok: true } } | { ok: false; error: string } {
  try {
    const parsed = parseJsonSafely(raw);
    const validated = validateGeminiOutput(parsed);
    if (!validated.ok) {
      return { ok: false, error: validated.error };
    }
    return { ok: true, value: validated as ReturnType<typeof validateGeminiOutput> & { ok: true } };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown JSON parse error";
    return { ok: false, error: message };
  }
}

async function requestOnce(apiKey: string, prompt: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });
  const response = await withTimeout(
    ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt
    }),
    REQUEST_TIMEOUT_MS
  );
  return extractResponseText(response).trim();
}

export async function generateExplanation(
  context: ExplainRequestContext,
  settings: UserSettings
): Promise<GeminiCallResult> {
  if (!settings.apiKey.trim()) {
    return {
      ok: false,
      errorCode: "missing_api_key",
      message: "Gemini API key is missing. Set it in Clarity settings."
    };
  }

  const basePrompt = buildPrompt(context, settings);

  try {
    const firstRaw = await requestOnce(settings.apiKey.trim(), basePrompt);
    const firstAttempt = parseAndValidate(firstRaw);
    if (firstAttempt.ok) {
      return { ok: true, result: firstAttempt.value.value };
    }

    const repairPrompt = buildRepairPrompt(basePrompt, firstRaw, firstAttempt.error);
    const secondRaw = await requestOnce(settings.apiKey.trim(), repairPrompt);
    const secondAttempt = parseAndValidate(secondRaw);
    if (secondAttempt.ok) {
      return { ok: true, result: secondAttempt.value.value };
    }

    return {
      ok: false,
      errorCode: "invalid_output",
      message: `Model returned invalid structured output twice. Last error: ${secondAttempt.error}`
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Gemini request error";
    if (message === "request_timeout") {
      return {
        ok: false,
        errorCode: "timeout",
        message: "Gemini request timed out. Please retry."
      };
    }
    return {
      ok: false,
      errorCode: "api_error",
      message
    };
  }
}
