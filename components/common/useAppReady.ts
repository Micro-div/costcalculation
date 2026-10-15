"use client";

import { useEffect, useState } from "react";
import { isAppReady, subscribeAppReady } from "@/lib/appReady";

/**
 * Returns true once the intro loader has finished and the site is visible.
 * Starts false so server and first client render match (no hydration flash).
 */
export function useAppReady() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isAppReady()) {
      setReady(true);
      return;
    }
    return subscribeAppReady(() => setReady(true));
  }, []);

  return ready;
}
