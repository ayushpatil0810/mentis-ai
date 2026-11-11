export const MODEL_STORAGE_KEY = "mentis_selected_model";

export function readSavedModel(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(MODEL_STORAGE_KEY) || "";
}

export function saveModelPreference(modelId: string) {
  if (!modelId || typeof window === "undefined") return;
  localStorage.setItem(MODEL_STORAGE_KEY, modelId);
}
