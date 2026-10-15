// The branded CostCalc loader lives in LoadingWrapper (root layout), which
// already holds the first paint until the site is ready. This route-level
// fallback intentionally renders nothing, otherwise the loader would appear
// a second time (0 → 100 again) after the wrapper finishes.
export default function Loading() {
  return null;
}
