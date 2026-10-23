import { describe, expect, it } from "vitest";
import { calculateEstimate } from "@/lib";
import { CONTINGENCY_RATE } from "@/lib/pricing";
import type { AiAnalysisPayload } from "@/lib/aiAnalysis";

const smallWebsite = () =>
  calculateEstimate(
    "I need a simple one-page portfolio website",
    "web",
    "us",
    "small",
    "essential",
  );

const aiExtraction = (
  overrides: Partial<AiAnalysisPayload> = {},
): AiAnalysisPayload => ({
  status: "ok",
  category: "Web development",
  projectType: "Website",
  subject: "bakery",
  heading: "Bakery website",
  features: [],
  complexity: "Standard",
  source: "ai",
  model: "test-model",
  ...overrides,
});

describe("calculateEstimate", () => {
  it("produces the same result for the same inputs", () => {
    expect(smallWebsite()).toEqual(smallWebsite());
  });

  it("builds the total from the rule-engine subtotal, contingency and tax", () => {
    const result = smallWebsite();

    expect(result.subtotal).toBeGreaterThan(0);
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.contingency).toBe(
      Math.round(result.subtotal * CONTINGENCY_RATE),
    );
    expect(result.taxes).toBe(
      Math.round((result.subtotal + result.contingency) * result.location.taxRate),
    );
    expect(result.total).toBe(
      result.subtotal + result.contingency + result.taxes,
    );
    expect(result.low).toBeLessThan(result.total);
    expect(result.high).toBeGreaterThan(result.total);
  });

  it("does not apply a $20k minimum to small projects", () => {
    const result = smallWebsite();
    expect(result.total).toBeGreaterThan(0);
    expect(result.total).toBeLessThan(20_000);
  });

  it("converts the rule-engine USD rates to the requested currency", () => {
    const usd = smallWebsite();
    const pkr = calculateEstimate(
      "I need a simple one-page portfolio website",
      "web",
      "us",
      "small",
      "essential",
      "PKR",
    );

    expect(pkr.location.currency).toBe("PKR");
    expect(pkr.total).toBeGreaterThan(usd.total);
  });

  it("ignores prices, duration or confidence supplied by the AI", () => {
    const tampered = {
      ...aiExtraction({ features: ["Online payment"] }),
      total: 1,
      pricing: { total: 1 },
      confidence: 100,
      duration: "1 hour",
    } as unknown as AiAnalysisPayload;

    const result = calculateEstimate(
      "Bakery website with online payment",
      "web",
      "us",
      "medium",
      "standard",
      null,
      tampered,
    );

    expect(result.total).toBeGreaterThan(1);
    expect(result.total).toBe(
      result.subtotal + result.contingency + result.taxes,
    );
    expect(result.confidence).toBeLessThanOrEqual(94);
    expect(result.aiSource).toBe("ai");
  });

  it("prices physical projects from unit cards with a month-based timeline", () => {
    const result = calculateEstimate(
      "Build a new warehouse",
      "web",
      "us",
      "medium",
      "standard",
      null,
      aiExtraction({
        kind: "physical",
        category: "Industrial",
        projectType: "Warehouse",
        heading: "Warehouse build",
        quantities: { squareMeters: 1200 },
      }),
    );

    expect(result.durationUnit).toBe("months");
    expect(result.durationMin).toBeGreaterThanOrEqual(2);
    expect(result.subtotal).toBeGreaterThan(0);
    expect(
      (result.components ?? []).map((component) => component.name),
    ).toContain("Land & foundations");
  });

  it("raises the price for a higher complexity", () => {
    const basic = calculateEstimate(
      "Bakery website",
      "web",
      "us",
      "medium",
      "standard",
      null,
      aiExtraction({ complexity: "essential" }),
    );
    const advanced = calculateEstimate(
      "Bakery website",
      "web",
      "us",
      "medium",
      "standard",
      null,
      aiExtraction({ complexity: "Advanced" }),
    );

    expect(advanced.total).toBeGreaterThan(basic.total);
  });
});
