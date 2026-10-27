"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  categories,
  locations,
  projectSizes,
  qualityOptions,
} from "@/constants";
import {
  detectLocation,
  matchLocation,
  scrollToSection,
} from "@/lib";
import type { SanitizedAnalysis } from "@/lib/analysisSchema";
import type {
  CategoryId,
  EstimateItem,
  EstimateResult,
  HistoryEntry,
  LocationId,
  ProjectSizeId,
  QualityId,
  SavedDraftData,
  ScopeItem,
  Stage,
} from "@/types";

const SHARE_ID_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;
const HISTORY_KEY = "costcalc-history";
const CONTROL_EVENT = "costcalc:choose-category";
const FOCUS_EVENT = "costcalc:focus-estimator";

const isEstimateData = (data: unknown): data is EstimateResult =>
  typeof data === "object" &&
  data !== null &&
  typeof (data as { projectTitle?: unknown }).projectTitle === "string";

function isEstimateApiResponse(value: unknown): value is {
  status: "ok";
  estimate: EstimateResult;
} {
  if (typeof value !== "object" || value === null) return false;
  const response = value as Record<string, unknown>;
  if (response.status !== "ok" || !isEstimateData(response.estimate)) {
    return false;
  }
  const estimate = response.estimate as EstimateResult;
  return (
    typeof estimate.shareId === "string" &&
    SHARE_ID_PATTERN.test(estimate.shareId) &&
    typeof estimate.description === "string" &&
    typeof estimate.total === "number" &&
    Number.isFinite(estimate.total) &&
    typeof estimate.low === "number" &&
    typeof estimate.high === "number" &&
    typeof estimate.confidence === "number" &&
    typeof estimate.durationMin === "number" &&
    typeof estimate.durationMax === "number" &&
    Array.isArray(estimate.items) &&
    typeof estimate.location?.currency === "string"
  );
}

function isPreparedAnalysis(value: unknown): value is SanitizedAnalysis {
  if (typeof value !== "object" || value === null) return false;
  const analysis = value as Record<string, unknown>;
  return (
    analysis.status === "ok" &&
    typeof analysis.category === "string" &&
    typeof analysis.projectType === "string" &&
    typeof analysis.heading === "string" &&
    typeof analysis.subject === "string" &&
    typeof analysis.understood === "string" &&
    typeof analysis.projectBrief === "string" &&
    typeof analysis.complexity === "string" &&
    typeof analysis.locationHint === "string" &&
    (analysis.kind === null ||
      analysis.kind === "physical" ||
      analysis.kind === "software" ||
      analysis.kind === "service") &&
    (analysis.size === null ||
      projectSizes.some((size) => size.id === analysis.size)) &&
    (analysis.quality === null ||
      qualityOptions.some((quality) => quality.id === analysis.quality)) &&
    Array.isArray(analysis.features) &&
    Array.isArray(analysis.assumptions) &&
    Array.isArray(analysis.scope) &&
    typeof analysis.quantities === "object" &&
    analysis.quantities !== null
  );
}

const isSavedDraft = (data: unknown): data is SavedDraftData =>
  typeof data === "object" &&
  data !== null &&
  typeof (data as { estimate?: unknown }).estimate === "object";

const estimateIdentity = (est: EstimateResult) =>
  (est.description ?? "").trim().toLowerCase();

const itemsSignature = (items?: EstimateItem[]) =>
  JSON.stringify(
    (items ?? []).map((item) => [
      item.name,
      item.detail,
      item.quantity,
      item.rate,
    ]),
  );

const savedEstimateIdentity = (entry: HistoryEntry) =>
  entry.type === "estimate" && isEstimateData(entry.data)
    ? estimateIdentity(entry.data)
    : "";

const findSavedEstimate = (history: HistoryEntry[], key: string) => {
  if (!key) return undefined;
  return history.find(
    (entry) =>
      entry.type === "estimate" && savedEstimateIdentity(entry) === key,
  );
};

const draftIdentity = (entry: HistoryEntry) => {
  if (entry.type !== "draft") return "";
  if (isEstimateData(entry.data)) return estimateIdentity(entry.data);
  return "identity" in entry.data &&
    typeof entry.data.identity === "string"
    ? entry.data.identity
    : "";
};

function readHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry): entry is HistoryEntry => {
      if (typeof entry !== "object" || entry === null) return false;
      const candidate = entry as Record<string, unknown>;
      return (
        typeof candidate.id === "string" &&
        (candidate.type === "estimate" || candidate.type === "draft") &&
        typeof candidate.title === "string" &&
        typeof candidate.savedAt === "string" &&
        typeof candidate.data === "object" &&
        candidate.data !== null
      );
    });
  } catch {
    return [];
  }
}

// Older saved estimates may predate the current scope item shape.
function refreshEstimate(est: EstimateResult): EstimateResult {
  if (Array.isArray(est.scope)) {
    const scope = (est.scope as unknown as Array<ScopeItem | string>).map(
      (item) =>
        typeof item === "string" ? { title: item, description: "" } : item,
    );
    return { ...est, scope };
  }
  return est;
}

export function useEstimateStudio() {
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<CategoryId>("web");
  const [locationId, setLocationId] = useState<LocationId>("us");
  const [locationSelectedManually, setLocationSelectedManually] =
    useState(false);
  const [stage, setStage] = useState<Stage>("describe");
  const [sizeId, setSizeId] = useState<ProjectSizeId>("medium");
  const [qualityId, setQualityId] = useState<QualityId>("standard");
  const [preparedAnalysis, setPreparedAnalysis] =
    useState<SanitizedAnalysis | null>(null);
  const [detailsPrepared, setDetailsPrepared] = useState(false);
  const [estimate, setEstimate] = useState<EstimateResult | null>(null);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quoteEstimate, setQuoteEstimate] = useState<EstimateResult | null>(
    null,
  );
  const [shareOpen, setShareOpen] = useState(false);
  const [quoteItems, setQuoteItems] = useState<EstimateItem[]>([]);
  const [toast, setToast] = useState("");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loadedDraftId, setLoadedDraftId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreparingDetails, setIsPreparingDetails] = useState(false);
  const [estimateError, setEstimateError] = useState("");
  const [errorToast, setErrorToast] = useState("");
  const [shareError, setShareError] = useState("");
  const [needsInfo, setNeedsInfo] = useState<{
    understood: string;
    questions: string[];
  } | null>(null);
  // Cancels an in-flight extraction when the user edits/resets or submits
  // again, so a stale answer can never overwrite newer input.
  const analyzeAbortRef = useRef<AbortController | null>(null);

  const selectedCategory = useMemo(
    () => categories.find((item) => item.id === categoryId) ?? categories[0],
    [categoryId],
  );
  const selectedLocation = useMemo(
    () => locations.find((item) => item.id === locationId) ?? locations[0],
    [locationId],
  );

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  };

  const notifyError = (message: string) => {
    setErrorToast(message);
    window.setTimeout(() => setErrorToast(""), 4000);
  };

  useEffect(() => {
    setHistory(readHistory());
  }, []);

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    try {
      localStorage.removeItem("costcalc-latest-estimate");
    } catch {
      // storage unavailable
    }
  }, []);

  // The URL carries only ?estimate=<id>. The exact estimate is loaded from
  // the server, so shared totals are identical to the ones that were shared.
  // Invalid links are cleared and explained instead of failing silently.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("estimate");
    if (!id) return;

    const clearParam = () => {
      const url = new URL(window.location.href);
      url.searchParams.delete("estimate");
      window.history.replaceState(null, "", url.toString());
    };

    if (!SHARE_ID_PATTERN.test(id)) {
      setShareError("This estimate link is invalid. Ask for a new link.");
      clearParam();
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/share/${encodeURIComponent(id)}`);
        if (!res.ok) throw new Error("not found");
        const data: unknown = await res.json();
        const stored =
          typeof data === "object" && data !== null
            ? (data as { estimate?: unknown }).estimate
            : undefined;
        if (!isEstimateData(stored)) throw new Error("invalid estimate");
        if (cancelled) return;

        setDescription(stored.description);
        setCategoryId(stored.category.id as CategoryId);
        setLocationId(stored.location.id);
        setSizeId(stored.size.id);
        setQualityId(stored.quality.id);
        setEstimate({ ...stored, shareId: id });
        setStage("complete");
        window.setTimeout(() => scrollToSection("estimate-result"), 150);
      } catch {
        if (!cancelled) {
          setShareError(
            "This estimate link is invalid or has expired. Please ask for a new one.",
          );
        }
      } finally {
        clearParam();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Abort any in-flight extraction on unmount.
  useEffect(() => () => analyzeAbortRef.current?.abort(), []);

  const prepareDetails = async (
    text: string,
    targetCategoryId: CategoryId,
    targetLocationId: LocationId,
    useLocationHint = !locationSelectedManually,
  ) => {
    if (isPreparingDetails || isGenerating) return;
    analyzeAbortRef.current?.abort();
    const controller = new AbortController();
    analyzeAbortRef.current = controller;
    let timedOut = false;
    const timeout = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 30_000);

    setIsPreparingDetails(true);
    setEstimateError("");
    setNeedsInfo(null);
    setShareError("");
    setEstimate(null);
    setDetailsPrepared(false);
    setLocationId(targetLocationId);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phase: "prepare",
          description: text,
          category: targetCategoryId,
          location: targetLocationId,
        }),
        signal: controller.signal,
      });
      const data: unknown = await response.json();
      if (!response.ok) {
        const message =
          typeof data === "object" &&
          data !== null &&
          typeof (data as { error?: unknown }).error === "string"
            ? (data as { error: string }).error
            : "We couldn't generate your estimate. Please try again.";
        throw new Error(message);
      }
      if (
        typeof data === "object" &&
        data !== null &&
        (data as { status?: unknown }).status === "needs_info" &&
        typeof (data as { understood?: unknown }).understood === "string" &&
        Array.isArray((data as { questions?: unknown }).questions)
      ) {
        const needsInfoData = data as {
          understood: string;
          questions: string[];
        };
        setNeedsInfo({
          understood: needsInfoData.understood,
          questions: needsInfoData.questions.filter(
            (question): question is string => typeof question === "string",
          ),
        });
        setPreparedAnalysis(null);
        setDetailsPrepared(false);
        setStage("describe");
        return;
      }
      const responseBody =
        typeof data === "object" && data !== null
          ? (data as { status?: unknown; analysis?: unknown })
          : null;
      if (
        responseBody?.status !== "ready" ||
        !isPreparedAnalysis(responseBody.analysis)
      ) {
        throw new Error("The analysis service returned invalid project details.");
      }
      const analysis = responseBody.analysis;
      setPreparedAnalysis(analysis);
      if (analysis.size) setSizeId(analysis.size);
      if (analysis.quality) setQualityId(analysis.quality);
      if (useLocationHint) {
        const hintedLocationId = matchLocation(analysis.locationHint);
        if (hintedLocationId) {
          setLocationId(hintedLocationId);
          setLocationSelectedManually(true);
        }
      }
      setStage("details");
      setDetailsPrepared(true);
    } catch (error) {
      if (controller.signal.aborted && !timedOut) return;
      setPreparedAnalysis(null);
      setStage("details");
      setDetailsPrepared(true);
      setEstimateError(
        `${timedOut ? "Project analysis timed out." : error instanceof Error ? error.message : "Project analysis failed."} You can confirm your details and retry with the estimate.`,
      );
    } finally {
      window.clearTimeout(timeout);
      if (!controller.signal.aborted || timedOut) setIsPreparingDetails(false);
    }
  };

  const generateEstimate = async (
    text: string,
    targetCategoryId: CategoryId,
    targetLocationId: LocationId,
    targetSizeId: ProjectSizeId,
    targetQualityId: QualityId,
  ) => {
    if (isGenerating) return;
    analyzeAbortRef.current?.abort();
    const controller = new AbortController();
    analyzeAbortRef.current = controller;
    let timedOut = false;
    const timeout = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 30_000);

    setIsGenerating(true);
    setStage("complete");
    setEstimate(null);
    setEstimateError("");
    setNeedsInfo(null);
    setShareError("");
    setLocationId(targetLocationId);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phase: "estimate",
          description: text,
          category: targetCategoryId,
          location: targetLocationId,
          size: targetSizeId,
          quality: targetQualityId,
        }),
        signal: controller.signal,
      });
      const data: unknown = await response.json();
      if (!response.ok) {
        const message =
          typeof data === "object" &&
          data !== null &&
          typeof (data as { error?: unknown }).error === "string"
            ? (data as { error: string }).error
            : "We couldn't generate your estimate. Please try again.";
        throw new Error(message);
      }
      if (
        typeof data === "object" &&
        data !== null &&
        (data as { status?: unknown }).status === "needs_info" &&
        typeof (data as { understood?: unknown }).understood === "string" &&
        Array.isArray((data as { questions?: unknown }).questions)
      ) {
        const needsInfoData = data as {
          understood: string;
          questions: string[];
        };
        setNeedsInfo({
          understood: needsInfoData.understood,
          questions: needsInfoData.questions.filter(
            (question): question is string => typeof question === "string",
          ),
        });
        setStage("describe");
        return;
      }
      if (!isEstimateApiResponse(data)) {
        throw new Error("The estimate service returned an invalid response.");
      }
      setEstimate(data.estimate);
      setLoadedDraftId(null);
      window.setTimeout(() => scrollToSection("estimate-result"), 80);
    } catch (error) {
      if (controller.signal.aborted && !timedOut) return;
      setEstimateError(
        timedOut
          ? "Estimate generation timed out. Please retry."
          : error instanceof Error
            ? error.message
            : "We couldn't generate your estimate. Please retry.",
      );
      setStage("details");
    } finally {
      window.clearTimeout(timeout);
      if (!controller.signal.aborted || timedOut) setIsGenerating(false);
    }
  };

  const beginEstimate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = description.trim();
    if (text.length < 12) return;
    if (detailsPrepared) {
      setEstimateError("");
      setStage("details");
      return;
    }
    const selectedLocationId = locationSelectedManually
      ? locationId
      : detectLocation(text);
    void prepareDetails(text, categoryId, selectedLocationId);
  };

  const retryEstimate = () => {
    const text = description.trim();
    if (text.length >= 12) {
      void generateEstimate(
        text,
        categoryId,
        locationId,
        sizeId,
        qualityId,
      );
    }
  };

  const confirmDetails = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = description.trim();
    if (text.length < 12) return;
    void generateEstimate(
      text,
      categoryId,
      locationId,
      sizeId,
      qualityId,
    );
  };

  const backToDescription = () => {
    if (isGenerating) return;
    setEstimateError("");
    setStage("describe");
  };

  const createEstimateFromChat = async (
    text: string,
    chosenLocationId?: LocationId,
  ) => {
    const clean = text.trim();
    if (clean.length < 3) return;

    setDescription(clean);
    const resolvedLocationId =
      chosenLocationId ||
      (locationSelectedManually ? locationId : detectLocation(clean));
    const loc =
      locations.find((item) => item.id === resolvedLocationId) ?? locations[0];

    setLocationId(loc.id);
    setLocationSelectedManually(true);
    setStage("describe");
    await prepareDetails(clean, categoryId, loc.id, false);
  };

  const resetEstimate = () => {
    analyzeAbortRef.current?.abort();
    analyzeAbortRef.current = null;
    window.history.replaceState(null, "", window.location.pathname);
    setDescription("");
    setCategoryId("web");
    setLocationId("us");
    setLocationSelectedManually(false);
    setStage("describe");
    setSizeId("medium");
    setQualityId("standard");
    setPreparedAnalysis(null);
    setDetailsPrepared(false);
    setEstimate(null);
    setEstimateError("");
    setNeedsInfo(null);
    setLoadedDraftId(null);
    setShareError("");
    setQuoteEstimate(null);
    setQuoteItems([]);
    setQuoteOpen(false);
    setShareOpen(false);
    setIsGenerating(false);
    setIsPreparingDetails(false);
    window.setTimeout(() => scrollToSection("estimator"), 50);
  };

  const chooseCategory = useCallback(
    (id: CategoryId) => {
      const category =
        categories.find((item) => item.id === id) ?? categories[0];
      setCategoryId(id);
      setStage("describe");
      setLoadedDraftId(null);
      setNeedsInfo(null);
      setPreparedAnalysis(null);
      setDetailsPrepared(false);
      setEstimate(null);
      if (!description.trim()) setDescription(category.example);
      window.setTimeout(() => scrollToSection("estimator"), 30);
    },
    [description],
  );

  // Server-rendered sections communicate through these two events, so their
  // markup does not need to ship a callback into the client bundle.
  useEffect(() => {
    const onChoose = (event: Event) => {
      const id = (event as CustomEvent<unknown>).detail;
      if (
        typeof id === "string" &&
        categories.some((category) => category.id === id)
      ) {
        chooseCategory(id as CategoryId);
      }
    };
    const onFocus = () => scrollToSection("estimator");
    window.addEventListener(CONTROL_EVENT, onChoose);
    window.addEventListener(FOCUS_EVENT, onFocus);
    return () => {
      window.removeEventListener(CONTROL_EVENT, onChoose);
      window.removeEventListener(FOCUS_EVENT, onFocus);
    };
  }, [chooseCategory]);

  // Manual edits always win over AI suggestions: they clear the automatic
  // category/location hints so nothing silently changes them later.
  const changeDescription = (value: string) => {
    if (isPreparingDetails) {
      analyzeAbortRef.current?.abort();
      setIsPreparingDetails(false);
    }
    setDescription(value);
    setNeedsInfo(null);
    setPreparedAnalysis(null);
    setDetailsPrepared(false);
    setEstimateError("");
  };

  const changeCategory = (id: CategoryId) => {
    if (isPreparingDetails) {
      analyzeAbortRef.current?.abort();
      setIsPreparingDetails(false);
    }
    setCategoryId(id);
    setPreparedAnalysis(null);
    setDetailsPrepared(false);
    setEstimateError("");
  };

  const changeLocation = (id: LocationId) => {
    if (isPreparingDetails) {
      analyzeAbortRef.current?.abort();
      setIsPreparingDetails(false);
    }
    setLocationId(id);
    setLocationSelectedManually(true);
    setEstimateError("");
  };

  const changeSize = (id: ProjectSizeId) => setSizeId(id);
  const changeQuality = (id: QualityId) => setQualityId(id);

  const closeQuote = () => {
    setQuoteOpen(false);
    setQuoteEstimate(null);
    setLoadedDraftId(null);
  };

  const openQuotation = () => {
    if (!estimate) return;
    setQuoteEstimate(estimate);
    setQuoteItems(estimate.items.map((item) => ({ ...item })));
    setLoadedDraftId(null);
    setQuoteOpen(true);
  };

  const buildShareUrl = () => {
    if (!estimate?.shareId) return "";
    const url = new URL(window.location.href);
    url.hash = "";
    url.search = "";
    url.searchParams.set("estimate", estimate.shareId);
    return url.toString();
  };

  const shareEstimate = async () => {
    if (!estimate) return;
    if (!estimate.shareId) {
      notifyError(
        "This saved estimate has no server share ID. Generate it again to share.",
      );
      return;
    }
    setShareOpen(true);
  };

  const commitHistory = (entries: HistoryEntry[]) => {
    const updated = entries.slice(0, 50);
    setHistory(updated);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch {
      notifyError("Could not save to this device (storage is unavailable).");
    }
  };

  const saveEstimate = () => {
    if (!estimate) return;
    const key = estimateIdentity(estimate);
    const signature = itemsSignature(estimate.items);
    const existing = findSavedEstimate(history, key);

    if (existing && isEstimateData(existing.data)) {
      const unchanged =
        itemsSignature(existing.data.items) === signature &&
        existing.data.projectTitle === estimate.projectTitle;
      if (unchanged) {
        notify("This estimate is already saved");
        return;
      }
      commitHistory(
        history.map((entry) =>
          entry.id === existing.id
            ? {
                ...entry,
                title: estimate.projectTitle,
                savedAt: new Date().toISOString(),
                data: estimate,
              }
            : entry,
        ),
      );
      notify("Saved estimate updated");
      return;
    }

    const entry: HistoryEntry = {
      id: `est-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type: "estimate",
      title: estimate.projectTitle,
      savedAt: new Date().toISOString(),
      data: estimate,
    };
    commitHistory([
      entry,
      ...history.filter(
        (item) => !(item.type === "draft" && draftIdentity(item) === key),
      ),
    ]);
    notify("Estimate saved on this device");
  };

  const saveDraft = (businessName?: string, customerName?: string) => {
    const base = quoteEstimate ?? estimate;
    if (!base) return;

    const key = estimateIdentity(base);
    const draftEstimate: EstimateResult = { ...base, items: quoteItems };
    const signature = itemsSignature(quoteItems);

    // A draft loaded into the editor becomes the saved estimate when the user
    // clicks "Save estimate".
    if (loadedDraftId) {
      const existing = findSavedEstimate(history, key);
      if (existing && isEstimateData(existing.data)) {
        const unchanged = itemsSignature(existing.data.items) === signature;
        commitHistory(
          history
            .filter((entry) => entry.id !== loadedDraftId)
            .map((entry) =>
              entry.id === existing.id && !unchanged
                ? {
                    ...entry,
                    title: base.projectTitle,
                    savedAt: new Date().toISOString(),
                    data: draftEstimate,
                  }
                : entry,
            ),
        );
        setLoadedDraftId(null);
        notify(
          unchanged
            ? "This estimate is already saved"
            : "Saved estimate updated",
        );
        return;
      }

      const estimateEntry: HistoryEntry = {
        id: `est-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type: "estimate",
        title: base.projectTitle,
        savedAt: new Date().toISOString(),
        data: draftEstimate,
      };
      commitHistory([
        estimateEntry,
        ...history.filter((entry) => entry.id !== loadedDraftId),
      ]);
      setLoadedDraftId(null);
      notify("Draft converted to estimate and saved");
      return;
    }

    const savedEstimate = findSavedEstimate(history, key);
    if (savedEstimate && isEstimateData(savedEstimate.data)) {
      const unchanged =
        itemsSignature(savedEstimate.data.items) === signature &&
        savedEstimate.data.projectTitle === base.projectTitle;
      if (unchanged) {
        notify("This estimate is already saved");
        return;
      }
      commitHistory(
        history.map((entry) =>
          entry.id === savedEstimate.id
            ? {
                ...entry,
                title: base.projectTitle,
                savedAt: new Date().toISOString(),
                data: draftEstimate,
              }
            : entry,
        ),
      );
      notify("Saved estimate updated");
      return;
    }

    const existingDraft = history.find(
      (entry) => entry.type === "draft" && draftIdentity(entry) === key,
    );
    const nextDraft: SavedDraftData = {
      estimate: draftEstimate,
      businessName: businessName ?? "",
      customerName: customerName ?? "",
      identity: key,
    };

    if (existingDraft) {
      commitHistory(
        history.map((entry) =>
          entry.id === existingDraft.id
            ? {
                ...entry,
                savedAt: new Date().toISOString(),
                data: nextDraft,
              }
            : entry,
        ),
      );
      notify("Draft updated");
      return;
    }

    const entry: HistoryEntry = {
      id: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type: "draft",
      title: base.projectTitle,
      savedAt: new Date().toISOString(),
      data: nextDraft,
    };
    commitHistory([entry, ...history]);
    setLoadedDraftId(null);
    notify("Draft saved on this device");
  };

  const loadHistoryEntry = (entry: HistoryEntry) => {
    if (entry.type === "estimate" && isEstimateData(entry.data)) {
      const est = refreshEstimate(entry.data);
      setDescription(est.description);
      setCategoryId(est.category.id as CategoryId);
      setLocationId(est.location.id);
      setSizeId(est.size.id);
      setQualityId(est.quality.id);
      setEstimate(est);
      setStage("complete");
      setLoadedDraftId(null);
      window.setTimeout(() => scrollToSection("estimate-result"), 80);
      return;
    }

    // Loading a draft NEVER mutates the current project: it opens the
    // quotation editor with the draft's own stored estimate.
    if (entry.type === "draft") {
      if (isEstimateData(entry.data)) {
        const draftEstimate = refreshEstimate(entry.data);
        setQuoteEstimate(draftEstimate);
        setQuoteItems(draftEstimate.items.map((item) => ({ ...item })));
        setLoadedDraftId(entry.id);
        setQuoteOpen(true);
        return;
      }
      if (isSavedDraft(entry.data)) {
        const draftEstimate = refreshEstimate(entry.data.estimate);
        setQuoteEstimate(draftEstimate);
        setQuoteItems(draftEstimate.items.map((item) => ({ ...item })));
        setLoadedDraftId(entry.id);
        setQuoteOpen(true);
        return;
      }
      notifyError(
        "This draft was saved by an older version and cannot be opened.",
      );
    }
  };

  const deleteHistoryEntry = (id: string) => {
    const updated = history.filter((entry) => entry.id !== id);
    setHistory(updated);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch {
      notifyError("Could not update saved items on this device.");
    }
  };

  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {
      // storage unavailable
    }
  };

  const activeStep = stage === "describe" ? 0 : stage === "details" ? 1 : 2;
  const descriptionReady = description.trim().length >= 12;

  return {
    description,
    categoryId,
    locationId,
    stage,
    sizeId,
    qualityId,
    estimate,
    quoteOpen,
    quoteEstimate,
    shareOpen,
    quoteItems,
    setQuoteItems,
    toast,
    errorToast,
    shareError,
    history,
    loadedDraftId,
    isGenerating,
    isPreparingDetails,
    estimateError,
    needsInfo,
    selectedCategory,
    selectedLocation,
    activeStep,
    descriptionReady,
    changeDescription,
    changeCategory,
    changeLocation,
    changeSize,
    changeQuality,
    closeQuote,
    setStage,
    setQuoteOpen,
    setQuoteEstimate,
    setShareOpen,
    notify,
    beginEstimate,
    confirmDetails,
    backToDescription,
    retryEstimate,
    createEstimateFromChat,
    resetEstimate,
    chooseCategory,
    openQuotation,
    buildShareUrl,
    shareEstimate,
    saveEstimate,
    saveDraft,
    loadHistoryEntry,
    deleteHistoryEntry,
    clearHistory,
  };
}
