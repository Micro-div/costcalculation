let productionWarningLogged = false;

export function isUpstashConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL &&
      process.env.UPSTASH_REDIS_REST_TOKEN,
  );
}

export function warnIfUpstashMissingInProduction(): void {
  if (
    process.env.NODE_ENV !== "production" ||
    isUpstashConfigured() ||
    productionWarningLogged
  ) {
    return;
  }
  productionWarningLogged = true;
  console.warn(
    "[config] UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are missing; shared rate limits and estimate storage are unavailable across server instances.",
  );
}
