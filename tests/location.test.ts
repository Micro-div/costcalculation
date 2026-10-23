import { describe, expect, it } from "vitest";
import { detectLocation, locationLabel, matchLocation } from "@/lib";

describe("matchLocation", () => {
  it("ignores place names that are only substrings of ordinary words", () => {
    // "nice" (France), "uk" inside "ukulele"/"duke" and "usa" inside
    // "usage" must not turn a normal sentence into a foreign location.
    expect(matchLocation("I need a nice website")).toBeNull();
    expect(matchLocation("app for ukulele lessons")).toBeNull();
    expect(matchLocation("duke university portal")).toBeNull();
    expect(matchLocation("usage-based billing")).toBeNull();
  });

  it("matches real city and country names as whole words", () => {
    expect(matchLocation("a bakery website in Lahore")).toBe("pk-lahore");
    expect(matchLocation("office fit-out in Dubai")).toBe("ae");
    expect(matchLocation("studio in Toronto")).toBe("ca");
    expect(matchLocation("clients in the United Kingdom")).toBe("uk");
  });

  it("accepts an ambiguous city only when it is used as a place", () => {
    expect(matchLocation("project in Nice, France")).toBe("fr-nice");
    expect(matchLocation("Nice, France project")).toBe("fr-nice");
    expect(matchLocation("a nice project")).toBeNull();
  });

  it("handles empty and non-text input", () => {
    expect(matchLocation("")).toBeNull();
    expect(matchLocation("   ")).toBeNull();
  });
});

describe("detectLocation", () => {
  it("falls back to the US when no location is mentioned", () => {
    expect(detectLocation("I need a nice website")).toBe("us");
  });

  it("returns the matched city when one is mentioned", () => {
    expect(detectLocation("a shop in Lahore")).toBe("pk-lahore");
  });
});

describe("locationLabel", () => {
  it("formats a known location as city and country", () => {
    expect(locationLabel("pk-lahore")).toBe("Lahore, Pakistan");
  });

  it("returns an empty label for unknown ids", () => {
    expect(locationLabel("nowhere" as never)).toBe("");
  });
});
