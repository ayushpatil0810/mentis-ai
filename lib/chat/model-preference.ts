export const MODEL_STORAGE_KEY = "mentis_selected_model";

const FAST_MODEL_ID = /(?:gpt-[a-z0-9.]*mini|gemini-[a-z0-9.]*flash|claude-[a-z0-9.]*haiku)/i;
const SLOW_MODEL_ID = /(?:^|\/)(?:o\d|gpt-5)|gemini-[a-z0-9.]*pro|claude-[a-z0-9.]*opus/i;

/** Prefer a small chat model over the newest reasoning model. */
export function pickDefaultModelId(modelIds: string[]): string | undefined {
  if (modelIds.length === 0) return undefined;
  return (
    modelIds.find((id) => FAST_MODEL_ID.test(id)) ??
    modelIds.find((id) => !SLOW_MODEL_ID.test(id)) ??
    modelIds[0]
  );
}

export function readSavedModel(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(MODEL_STORAGE_KEY) || "";
}

export function saveModelPreference(modelId: string) {
  if (!modelId || typeof window === "undefined") return;
  localStorage.setItem(MODEL_STORAGE_KEY, modelId);
}
