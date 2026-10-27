import type {
  EstimateResult,
  HistoryEntry,
  LegacyDraftData,
  SavedDraftData,
} from "@/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function isValidEstimateData(value: unknown): value is EstimateResult {
  if (
    !isRecord(value) ||
    typeof value.projectTitle !== "string" ||
    !value.projectTitle.trim() ||
    typeof value.description !== "string" ||
    value.description.length > 5000
  ) {
    return false;
  }
  if (
    !isRecord(value.category) ||
    typeof value.category.id !== "string" ||
    !value.category.id
  ) {
    return false;
  }
  if (
    !isRecord(value.location) ||
    typeof value.location.id !== "string" ||
    !value.location.id ||
    typeof value.location.currency !== "string" ||
    !isFiniteNumber(value.location.taxRate)
  ) {
    return false;
  }
  if (
    !isRecord(value.size) ||
    typeof value.size.id !== "string" ||
    !value.size.id ||
    !isRecord(value.quality) ||
    typeof value.quality.id !== "string" ||
    !value.quality.id
  ) {
    return false;
  }
  if (!Array.isArray(value.items) || value.items.length > 100) return false;
  for (const item of value.items) {
    if (
      !isRecord(item) ||
      typeof item.name !== "string" ||
      typeof item.detail !== "string" ||
      !isFiniteNumber(item.quantity) ||
      !isFiniteNumber(item.rate)
    ) {
      return false;
    }
  }
  for (const key of [
    "subtotal",
    "contingency",
    "taxes",
    "total",
    "low",
    "high",
  ]) {
    if (!isFiniteNumber(value[key])) return false;
  }
  if (
    !isFiniteNumber(value.confidence) ||
    !isFiniteNumber(value.durationMin) ||
    !isFiniteNumber(value.durationMax) ||
    !Array.isArray(value.scope) ||
    !value.scope.every(
      (item) =>
        typeof item === "string" ||
        (isRecord(item) &&
          typeof item.title === "string" &&
          (item.description === undefined ||
            typeof item.description === "string")),
    ) ||
    !Array.isArray(value.assumptions) ||
    !value.assumptions.every((item) => typeof item === "string") ||
    !Array.isArray(value.risks) ||
    !value.risks.every((item) => typeof item === "string")
  ) {
    return false;
  }
  return true;
}

export function isValidSavedDraftData(value: unknown): value is SavedDraftData {
  return (
    isRecord(value) &&
    isValidEstimateData(value.estimate) &&
    typeof value.businessName === "string" &&
    typeof value.customerName === "string" &&
    typeof value.identity === "string"
  );
}

function isValidLegacyDraftData(value: unknown): value is LegacyDraftData {
  return (
    isRecord(value) &&
    Array.isArray(value.items) &&
    value.items.every(
      (item) =>
        isRecord(item) &&
        typeof item.name === "string" &&
        typeof item.detail === "string" &&
        isFiniteNumber(item.quantity) &&
        isFiniteNumber(item.rate),
    ) &&
    typeof value.businessName === "string" &&
    typeof value.customerName === "string"
  );
}

export function isValidHistoryEntry(value: unknown): value is HistoryEntry {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.title !== "string" ||
    typeof value.savedAt !== "string"
  ) {
    return false;
  }
  if (value.type === "estimate") return isValidEstimateData(value.data);
  if (value.type !== "draft") return false;
  return (
    isValidEstimateData(value.data) ||
    isValidSavedDraftData(value.data) ||
    isValidLegacyDraftData(value.data)
  );
}
