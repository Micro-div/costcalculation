import { describe, expect, it } from "vitest";
import {
  isValidEstimateData,
  isValidHistoryEntry,
  isValidSavedDraftData,
} from "@/lib/estimateValidation";
import { calculateEstimate } from "@/lib";
import type { HistoryEntry } from "@/types";

const estimate = () =>
  calculateEstimate(
    "Bakery website with online payment",
    "web",
    "us",
    "medium",
    "standard",
  );

const historyEntry = (data: unknown): unknown => ({
  id: "history-1",
  type: "estimate",
  title: "Bakery website",
  savedAt: new Date().toISOString(),
  data,
});

describe("local history validation", () => {
  it("rejects null and incomplete estimates", () => {
    const valid = estimate();

    expect(isValidEstimateData(null)).toBe(false);
    expect(isValidEstimateData({ ...valid, projectTitle: undefined })).toBe(
      false,
    );
    expect(isValidEstimateData({ ...valid, category: {} })).toBe(false);
  });

  it("accepts a complete estimate and rejects invalid history entries", () => {
    const valid = estimate();

    expect(isValidEstimateData(valid)).toBe(true);
    expect(isValidHistoryEntry(historyEntry(null))).toBe(false);
    expect(
      isValidHistoryEntry(historyEntry({ ...valid, category: null })),
    ).toBe(false);
    expect(isValidHistoryEntry(historyEntry(valid))).toBe(true);
  });

  it("rejects drafts with null or incomplete estimates", () => {
    expect(
      isValidSavedDraftData({
        estimate: null,
        businessName: "Studio",
        customerName: "",
        identity: "draft-1",
      }),
    ).toBe(false);
    expect(
      isValidSavedDraftData({
        estimate: { projectTitle: "Project" },
        businessName: "Studio",
        customerName: "",
        identity: "draft-1",
      }),
    ).toBe(false);
    const validEntry: HistoryEntry = {
      id: "draft-1",
      type: "draft",
      title: "Bakery website",
      savedAt: new Date().toISOString(),
      data: {
        estimate: estimate(),
        businessName: "Studio",
        customerName: "",
        identity: "draft-1",
      },
    };
    expect(isValidHistoryEntry(validEntry)).toBe(true);
  });
});
