import { beforeEach, describe, expect, it } from "vitest";
import { checkRateLimit, clientKey } from "@/lib/rateLimit";

const options = (scope: string, max = 2, windowMs = 60_000) => ({
  max,
  windowMs,
  scope,
});

const request = (headers: Record<string, string> = {}) =>
  new Request("https://costcalc.example/api/chat", { headers });

let scopeCounter = 0;
const uniqueScope = () => `test-${Date.now()}-${scopeCounter++}`;

describe("clientKey", () => {
  it("uses x-real-ip only", () => {
    expect(clientKey(request({ "x-real-ip": "203.0.113.7" }))).toBe(
      "203.0.113.7",
    );
    expect(
      clientKey(
        request({
          "x-forwarded-for": "198.51.100.1",
          "x-real-ip": "203.0.113.7",
        }),
      ),
    ).toBe("203.0.113.7");
  });

  it("ignores a spoofable x-forwarded-for header", () => {
    expect(clientKey(request({ "x-forwarded-for": "198.51.100.1" }))).toBe(
      "unknown",
    );
  });
});

describe("checkRateLimit (memory fallback)", () => {
  beforeEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  it("allows requests up to the limit and then blocks", async () => {
    const scope = uniqueScope();
    const opts = options(scope, 2);

    const first = await checkRateLimit(request(), opts);
    const second = await checkRateLimit(request(), opts);
    const third = await checkRateLimit(request(), opts);

    expect(first).toEqual({ limited: false, remaining: 1 });
    expect(second).toEqual({ limited: false, remaining: 0 });
    expect(third).toEqual({ limited: true, remaining: 0 });
  });

  it("keeps separate buckets per scope and per real IP", async () => {
    const scopeA = uniqueScope();
    const scopeB = uniqueScope();

    await checkRateLimit(request({ "x-real-ip": "203.0.113.1" }), options(scopeA, 1));
    const otherIp = await checkRateLimit(
      request({ "x-real-ip": "203.0.113.2" }),
      options(scopeA, 1),
    );
    const otherScope = await checkRateLimit(
      request({ "x-real-ip": "203.0.113.1" }),
      options(scopeB, 1),
    );

    expect(otherIp.limited).toBe(false);
    expect(otherScope.limited).toBe(false);
  });

  it("does not let changing x-forwarded-for reset the bucket", async () => {
    const scope = uniqueScope();
    const opts = options(scope, 1);

    await checkRateLimit(
      request({ "x-forwarded-for": "198.51.100.1" }),
      opts,
    );
    const spoofed = await checkRateLimit(
      request({ "x-forwarded-for": "198.51.100.2" }),
      opts,
    );

    expect(spoofed.limited).toBe(true);
  });

  it("starts a new window after the previous one expires", async () => {
    const scope = uniqueScope();
    const opts = options(scope, 1, 10);

    expect((await checkRateLimit(request(), opts)).limited).toBe(false);
    expect((await checkRateLimit(request(), opts)).limited).toBe(true);

    await new Promise((resolve) => setTimeout(resolve, 25));

    expect((await checkRateLimit(request(), opts)).limited).toBe(false);
  });
});
