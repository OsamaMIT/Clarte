import type { GeminiOutput } from "./types";

type ValidationResult =
  | {
      ok: true;
      value: GeminiOutput;
    }
  | {
      ok: false;
      error: string;
    };

function extractJsonCandidate(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return trimmed.slice(start, end + 1);
  }
  return trimmed;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function parseJsonSafely(raw: string): unknown {
  const candidate = extractJsonCandidate(raw);
  return JSON.parse(candidate);
}

export function validateGeminiOutput(value: unknown): ValidationResult {
  if (!value || typeof value !== "object") {
    return { ok: false, error: "Response is not an object." };
  }

  const record = value as Record<string, unknown>;

  if (!isNonEmptyString(record.meaning)) {
    return { ok: false, error: "Field 'meaning' must be a non-empty string." };
  }
  if (!isNonEmptyString(record.simpler_version)) {
    return { ok: false, error: "Field 'simpler_version' must be a non-empty string." };
  }
  if (!isNonEmptyString(record.uncertainty_reason)) {
    return { ok: false, error: "Field 'uncertainty_reason' must be a non-empty string." };
  }
  if (typeof record.needs_more_context !== "boolean") {
    return { ok: false, error: "Field 'needs_more_context' must be boolean." };
  }
  if (typeof record.confidence !== "number" || Number.isNaN(record.confidence)) {
    return { ok: false, error: "Field 'confidence' must be a valid number." };
  }
  if (record.confidence < 0 || record.confidence > 1) {
    return { ok: false, error: "Field 'confidence' must be between 0 and 1." };
  }

  return {
    ok: true,
    value: {
      meaning: record.meaning.trim(),
      simpler_version: record.simpler_version.trim(),
      confidence: record.confidence,
      needs_more_context: record.needs_more_context,
      uncertainty_reason: record.uncertainty_reason.trim()
    }
  };
}
