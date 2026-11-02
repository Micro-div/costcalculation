import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { SanitizedAnalysis } from "@/lib/analysisSchema";
import {
  analysisContext,
  createAnalysisToken,
  verifyAnalysisToken,
} from "@/lib/analysisToken";

const analysis: SanitizedAnalysis = {
  status: "ok",
  understood: "A bakery website with online payment",
  projectBrief: "Bakery website with online payment",
  kind: "software",
  category: "Web development",
  projectType: "Website",
  subject: "Bakery",
  heading: "Bakery website",
  features: ["Online payment"],
  complexity: "Standard",
  size: "medium",
  quality: "standard",
  quantities: {},
  locationHint: "Lahore",
  assumptions: [],
  scope: [],
};

const context = analysisContext(
  "A bakery website with online payment",
  "web",
  "pk",
);

describe("analysis tokens", () => {
  beforeEach(() => {
    process.env.ANALYSIS_TOKEN_SECRET = "test-signing-secret";
  });

  afterEach(() => {
    delete process.env.ANALYSIS_TOKEN_SECRET;
  });

  it("round-trips a prepared analysis for the same context", () => {
    const token = createAnalysisToken(context, analysis, "test-model");
    expect(typeof token).toBe("string");

    expect(verifyAnalysisToken(token, context)).toEqual({
      analysis,
      model: "test-model",
    });
  });

  it("rejects a token used for a different description, category or location", () => {
    const token = createAnalysisToken(context, analysis, null);
    const other = analysisContext(
      "A shop fit-out in Karachi",
      "web",
      "pk",
    );

    expect(verifyAnalysisToken(token, other)).toBeNull();
  });

  it("rejects a tampered token", () => {
    const token = createAnalysisToken(context, analysis, null);
    const [encoded, signature] = String(token).split(".");
    const tampered = `${encoded}.${signature?.slice(0, -1)}x`;

    expect(verifyAnalysisToken(tampered, context)).toBeNull();
  });

  it("rejects an expired token", () => {
    const token = createAnalysisToken(context, analysis, null, -1);
    expect(verifyAnalysisToken(token, context)).toBeNull();
  });

  it("rejects malformed or missing tokens", () => {
    expect(verifyAnalysisToken("", context)).toBeNull();
    expect(verifyAnalysisToken("not-a-token", context)).toBeNull();
    expect(verifyAnalysisToken(null, context)).toBeNull();
  });
});
