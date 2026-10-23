import { describe, expect, it } from "vitest";
import { calculateEstimate } from "@/lib";
import {
  getStoredEstimate,
  isValidShareId,
  saveEstimate,
  SHARE_ID_PATTERN,
} from "@/lib/estimateStore";

const sampleEstimate = () =>
  calculateEstimate(
    "Bakery website with online payment",
    "web",
    "us",
    "medium",
    "standard",
  );

describe("share ids", () => {
  it("accepts 8-64 url-safe characters and rejects everything else", () => {
    expect(isValidShareId("AbCd_12-9")).toBe(true);
    expect(isValidShareId("a".repeat(64))).toBe(true);

    expect(isValidShareId("short")).toBe(false);
    expect(isValidShareId("a".repeat(65))).toBe(false);
    expect(isValidShareId("bad id here")).toBe(false);
    expect(isValidShareId("../../etc/passwd")).toBe(false);
    expect(isValidShareId(12345678)).toBe(false);
    expect(isValidShareId(null)).toBe(false);
    expect(isValidShareId(undefined)).toBe(false);
  });

  it("matches the pattern exported for the URL parameter", () => {
    expect(SHARE_ID_PATTERN.test("AbCd_12-9")).toBe(true);
  });
});

describe("estimate store", () => {
  it("round-trips the exact estimate through a share link id", async () => {
    const estimate = sampleEstimate();
    const id = await saveEstimate(estimate);

    expect(id).not.toBeNull();
    expect(isValidShareId(id)).toBe(true);

    // A share link carries only the id; the estimate comes back unchanged.
    const url = new URL(`https://costcalc.example/?estimate=${id}`);
    const fromUrl = url.searchParams.get("estimate");
    expect(isValidShareId(fromUrl)).toBe(true);
    expect(await getStoredEstimate(fromUrl as string)).toEqual(estimate);
  });

  it("returns null for unknown or malformed ids", async () => {
    expect(await getStoredEstimate("unknown-id")).toBeNull();
    expect(await getStoredEstimate("../../etc/passwd")).toBeNull();
    expect(await getStoredEstimate(12345678 as never)).toBeNull();
  });

  it("refuses to persist a payload that is not a valid estimate", async () => {
    expect(await saveEstimate({} as never)).toBeNull();
    expect(
      await saveEstimate({
        ...sampleEstimate(),
        total: Number.NaN,
      } as never),
    ).toBeNull();
  });
});
