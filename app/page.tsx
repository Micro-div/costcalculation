"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { GeneratingOverlay } from "@/components/common/GeneratingOverlay";
import { Toast } from "@/components/common/Toast";
import { CtaSection } from "@/components/home/CtaSection";
import { EstimateResultSection } from "@/components/home/EstimateResult";
import { Hero } from "@/components/home/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { ServicesSection } from "@/components/home/ServicesSection";
import { WhyCostCalc } from "@/components/home/WhyCostCalc";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { QuoteModal } from "@/components/quotation/QuoteModal";
import { ShareModal } from "@/components/share/ShareModal";
import {
  categories,
  locations,
  projectSizes,
  qualityOptions,
} from "@/constants";
import {
  calculateEstimate,
  detectLocation,
  scrollToSection,
} from "@/lib";
import { fetchAiAnalysis, getCachedAiAnalysis } from "@/lib/aiAnalysis";
import { analyzeProject, analyzeProjectWithAi } from "@/lib/analyzeProject";
import type {
  CategoryId,
  CurrencyCode,
  CustomProjectType,
  EstimateItem,
  EstimateResult,
  LocationId,
  ProjectSizeId,
  QualityId,
  ScopeItem,
  SharedEstimate,
} from "@/types";

interface HistoryEntry {
  id: string;
  type: "estimate" | "draft";
  title: string;
  savedAt: string;
  data: EstimateResult | { items: EstimateItem[]; businessName: string; customerName: string };
}

const HISTORY_KEY = "costcalc-history";
const CUSTOM_PROJECT_TYPES_KEY = "customProjectTypes";

export default function Home() {
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<CategoryId>("web");
  const [locationId, setLocationId] = useState<LocationId>("us");
  const [locationSelectedManually, setLocationSelectedManually] =
    useState(false);
  const [sizeId, setSizeId] = useState<ProjectSizeId>("medium");
  const [qualityId, setQualityId] = useState<QualityId>("standard");
  const [questionStep, setQuestionStep] = useState(0);
  const [stage, setStage] = useState<"describe" | "questions" | "complete">(
    "describe",
  );
  const [estimate, setEstimate] = useState<EstimateResult | null>(null);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [quoteItems, setQuoteItems] = useState<EstimateItem[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [currencyOverride, setCurrencyOverride] = useState<CurrencyCode | null>(
    null,
  );
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loadedDraftId, setLoadedDraftId] = useState<string | null>(null);
  const [customDescription, setCustomDescription] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customSummary, setCustomSummary] = useState("");
  const [customProjectTypes, setCustomProjectTypes] = useState<CustomProjectType[]>(
    [],
  );
  const [selectedCustom, setSelectedCustom] =
    useState<CustomProjectType | null>(null);
  const [titleOverride, setTitleOverride] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState("");
  const [categoryManual, setCategoryManual] = useState(false);
  const [autoCategory, setAutoCategory] = useState<string | null>(null);
  // The AI's own category label (e.g. "Zoo / Wildlife Park", "Physical Shop")
  // shown in the dropdown when the AI detects a category not in the preset list.
  const [aiCategoryLabel, setAiCategoryLabel] = useState<string | null>(null);
  // Guards against stale AI responses: only the newest request may apply.
  const aiRequestRef = useRef(0);

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
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as HistoryEntry[];
        if (Array.isArray(parsed)) {
          setHistory(parsed);
        }
      }
    } catch {
      // ignore corrupted history
    }
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CUSTOM_PROJECT_TYPES_KEY);
      if (!raw) return;
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;
      setCustomProjectTypes(
        parsed.filter((item): item is CustomProjectType => {
          if (typeof item !== "object" || item === null) return false;
          const candidate = item as Record<string, unknown>;
          return (
            typeof candidate.name === "string" &&
            typeof candidate.type === "string" &&
            Array.isArray(candidate.features)
          );
        }),
      );
    } catch {
      // ignore corrupted storage
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.removeItem("costcalc-latest-estimate");
    } catch {
      // ignore
    }
  }, []);

  // While typing, auto-select the detected category in the dropdown.
  // Once the user picks a category manually, stop overriding it.
  // The AI pass (POST /api/analyze, server-side Groq) is the PRIMARY source
  // for category detection — it can detect new categories (zoo, physical shop,
  // etc.) that the rule-based preset list doesn't know about. The rule-based
  // pass is only used as a fallback when the AI is unavailable.
  useEffect(() => {
    const handle = window.setTimeout(() => {
      const text = description.trim();
      if (text.length < 8) {
        setAutoCategory(null);
        setAiCategoryLabel(null);
        return;
      }
      // Rule-based runs instantly as a preliminary guess (used only if AI fails)
      const analysis = analyzeProject(text);
      if (!categoryManual) {
        setCategoryId(analysis.categoryId as CategoryId);
        setAutoCategory(analysis.category);
      }
      // AI pass — this is the PRIMARY source for category + pricing
      const requestId = ++aiRequestRef.current;
      void fetchAiAnalysis(text, locationId).then((ai) => {
        if (!ai || requestId !== aiRequestRef.current || categoryManual) return;
        const refined = analyzeProjectWithAi(text, ai);
        // AI's category is PRIMARY — it overrides the rule-based detection
        setCategoryId(refined.categoryId as CategoryId);
        setAutoCategory(refined.aiCategory ?? refined.category);
        // Store the AI's own category label for the dropdown
        if (refined.aiCategory) {
          setAiCategoryLabel(refined.aiCategory);
        }
      });
    }, 400);
    return () => window.clearTimeout(handle);
  }, [description, categoryManual, locationId]);

  useEffect(() => {
    if (!window.location.hash.startsWith("#estimate=")) return;

    try {
      const raw = window.location.hash.replace("#estimate=", "");
      const shared = JSON.parse(decodeURIComponent(raw)) as SharedEstimate;
      const categoryIsValid = categories.some(
        (item) => item.id === shared.categoryId,
      );
      const locationIsValid = locations.some(
        (item) => item.id === shared.locationId,
      );
      const sizeIsValid = projectSizes.some(
        (item) => item.id === shared.sizeId,
      );
      const qualityIsValid = qualityOptions.some(
        (item) => item.id === shared.qualityId,
      );

      if (
        !shared.description ||
        !categoryIsValid ||
        !locationIsValid ||
        !sizeIsValid ||
        !qualityIsValid
      ) {
        return;
      }

      setDescription(shared.description);
      setCategoryId(shared.categoryId);
      setLocationId(shared.locationId);
      setSizeId(shared.sizeId);
      setQualityId(shared.qualityId);
      setEstimate(
        calculateEstimate(
          shared.description,
          shared.categoryId,
          shared.locationId,
          shared.sizeId,
          shared.qualityId,
          currencyOverride,
          getCachedAiAnalysis(shared.description, shared.locationId),
        ),
      );
      setStage("complete");
      window.setTimeout(() => scrollToSection("estimate-result"), 200);
    } catch {
      window.history.replaceState(null, "", window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currencyOverride]);

  const persistCustomProjectTypes = (next: CustomProjectType[]) => {
    setCustomProjectTypes(next);
    try {
      localStorage.setItem(CUSTOM_PROJECT_TYPES_KEY, JSON.stringify(next));
    } catch {
      // storage unavailable
    }
  };

  const saveCustomProjectType = (type: CustomProjectType) => {
    persistCustomProjectTypes([
      ...customProjectTypes.filter(
        (item) => item.name.toLowerCase() !== type.name.toLowerCase(),
      ),
      type,
    ]);
  };

  const removeCustomProjectType = (name: string) => {
    persistCustomProjectTypes(
      customProjectTypes.filter((item) => item.name !== name),
    );
    if (selectedCustom?.name === name) setSelectedCustom(null);
  };

  const selectCustomType = (name: string) => {
    const custom = customProjectTypes.find((item) => item.name === name);
    if (!custom) return;
    setSelectedCustom(custom);
    setCategoryId(custom.type);
    if (!description.trim()) {
      setDescription(`${custom.name}: ${custom.features.join(", ")}`);
    }
  };

  const analyzeCustomProject = async () => {
    const text = customDescription.trim();
    if (!text || analyzing) return;

    setAnalyzing(true);
    setCustomSummary("");
    try {
      const res = await fetch("/api/estimates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: text }),
      });

      const contentType = res.headers.get("content-type") ?? "";
      if (!res.ok || !contentType.includes("application/json")) {
        let message = "Could not analyze your project. Please try again.";
        try {
          const data: unknown = await res.json();
          if (
            typeof data === "object" &&
            data !== null &&
            typeof (data as { error?: unknown }).error === "string"
          ) {
            message = (data as { error: string }).error;
          }
        } catch {
          // keep the default message
        }
        notifyError(message);
        return;
      }

      const data = (await res.json()) as CustomProjectType & {
        complexity: ProjectSizeId;
        summary: string;
      };
      const customType: CustomProjectType = {
        name: data.name,
        type: data.type,
        features: data.features,
      };
      saveCustomProjectType(customType);
      setSelectedCustom(customType);
      setCategoryId(data.type);
      setSizeId(data.complexity);
      setTitleOverride(data.name);
      setCustomSummary(data.summary);
      if (!description.trim()) {
        setDescription(`${data.name}: ${data.features.join(", ")}`);
      }
      setCustomDescription("");
      notify(`Analyzed: ${data.name}`);
    } catch {
      notifyError("Could not analyze your project. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const beginEstimate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (description.trim().length < 12) return;

    const selectedLocationId = locationSelectedManually
      ? locationId
      : detectLocation(description);
    // AI's classification is PRIMARY — it detects the real project type
    // (web app, physical shop, zoo, etc.) and provides real market pricing.
    // Only when the AI is unavailable do we fall back to rule-based detection.
    const aiAnalysis = getCachedAiAnalysis(description, selectedLocationId);
    const detectedCategory = selectedCustom
      ? categoryId
      : (analyzeProjectWithAi(description, aiAnalysis).categoryId as CategoryId);
    setCategoryId(detectedCategory);
    setLocationId(selectedLocationId);
    setQuestionStep(0);
    setStage("questions");
    setLoadedDraftId(null);
    window.setTimeout(() => scrollToSection("estimator"), 30);
  };

  const continueQuestions = () => {
    if (questionStep === 0) {
      setQuestionStep(1);
      return;
    }

    setIsGenerating(true);

    window.setTimeout(() => {
      // Use the AI analysis (if it arrived in time) as the analysis input:
      // its own project type, real-world pricing for this location and
      // realistic timeline drive the estimate. Only when the AI is
      // unavailable does the static USD config price the result.
      const aiAnalysis = getCachedAiAnalysis(description, locationId);
      const result = calculateEstimate(
        description,
        categoryId,
        locationId,
        sizeId,
        qualityId,
        currencyOverride,
        aiAnalysis,
      );
      if (titleOverride) {
        result.projectTitle = titleOverride;
        setTitleOverride(null);
      }
      setEstimate(result);
      setStage("complete");
      setLoadedDraftId(null);
      setIsGenerating(false);

      // Nayi estimate generate hote hi auto-save draft mein
      const draftEntry: HistoryEntry = {
        id: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type: "draft",
        title: result.projectTitle,
        savedAt: new Date().toISOString(),
        data: result,
      };
      const updated = [draftEntry, ...history].slice(0, 50);
      setHistory(updated);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));

      window.setTimeout(() => scrollToSection("estimate-result"), 80);
    }, 2000);
  };

  const resetEstimate = () => {
    window.history.replaceState(null, "", window.location.pathname);
    setDescription("");
    setCustomDescription("");
    setCustomSummary("");
    setSelectedCustom(null);
    setTitleOverride(null);
    setCategoryManual(false);
    setAutoCategory(null);
    setAiCategoryLabel(null);
    setCategoryId("web");
    setLocationId("us");
    setLocationSelectedManually(false);
    setSizeId("medium");
    setQualityId("standard");
    setQuestionStep(0);
    setStage("describe");
    setEstimate(null);
    setLoadedDraftId(null);
    setShareOpen(false);
    window.setTimeout(() => scrollToSection("estimator"), 50);
  };

  const chooseCategory = (id: CategoryId) => {
    const category = categories.find((item) => item.id === id) ?? categories[0];
    setCategoryId(id);
    setSelectedCustom(null);
    setCategoryManual(true);
    setAutoCategory(null);
    setStage("describe");
    setLoadedDraftId(null);
    if (!description.trim()) setDescription(category.example);
    window.setTimeout(() => scrollToSection("estimator"), 30);
  };

  const openQuotation = () => {
    if (!estimate) return;
    setQuoteItems(estimate.items.map((item) => ({ ...item })));
    setLoadedDraftId(null);
    setQuoteOpen(true);
  };

  // Builds the link that rebuilds this estimate when someone opens it.
  const buildShareUrl = () => {
    const payload: SharedEstimate = {
      description,
      categoryId,
      locationId,
      sizeId,
      qualityId,
    };
    const url = new URL(window.location.href);
    url.hash = `estimate=${encodeURIComponent(JSON.stringify(payload))}`;
    return url.toString();
  };

  // The Share button now opens the share popup instead of only copying the link.
  const shareEstimate = () => {
    if (!estimate) return;
    setShareOpen(true);
  };

  const saveEstimate = () => {
    if (!estimate) return;
    const entry: HistoryEntry = {
      id: `est-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type: "estimate",
      title: estimate.projectTitle,
      savedAt: new Date().toISOString(),
      data: estimate,
    };
    // Estimate save karne par matching draft hat jaye
    const updated = [
      entry,
      ...history.filter(
        (e) => !(e.type === "draft" && e.title === estimate.projectTitle),
      ),
    ].slice(0, 50);
    setHistory(updated);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    notify("Estimate saved on this device");
  };

  const saveDraft = (businessName?: string, customerName?: string) => {
    if (!estimate) return;

    // Agar yeh draft history se load hua tha, toh save karte waqt
    // estimate ban jaye aur purana draft history se hat jaye
    if (loadedDraftId) {
      const estimateEntry: HistoryEntry = {
        id: `est-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type: "estimate",
        title: estimate.projectTitle,
        savedAt: new Date().toISOString(),
        data: {
          ...estimate,
          items: quoteItems,
        },
      };
      const updated = [
        estimateEntry,
        ...history.filter((e) => e.id !== loadedDraftId),
      ].slice(0, 50);
      setHistory(updated);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      setLoadedDraftId(null);
      notify("Draft converted to estimate and saved");
      return;
    }

    const entry: HistoryEntry = {
      id: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type: "draft",
      title: estimate.projectTitle,
      savedAt: new Date().toISOString(),
      data: {
        items: quoteItems,
        businessName: businessName ?? "",
        customerName: customerName ?? "",
      },
    };
    const updated = [entry, ...history].slice(0, 50);
    setHistory(updated);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    setLoadedDraftId(null);
    notify("Draft saved on this device");
  };

  // Older saved estimates may predate the analyzer-driven fields.
  // Re-run them through the current calculator so they never override
  // the new result format.
  const refreshEstimate = (est: EstimateResult): EstimateResult => {
    if (
      Array.isArray(est.scope) &&
      Array.isArray(est.assumptions) &&
      Array.isArray(est.risks)
    ) {
      // Older saved estimates used plain strings for scope items — lift
      // them to the { title, description } shape the UI now renders.
      const scope = (est.scope as unknown as Array<ScopeItem | string>).map(
        (item) =>
          typeof item === "string"
            ? { title: item, description: "" }
            : item,
      );
      return { ...est, scope };
    }
    return calculateEstimate(
      est.description,
      est.category?.id ?? "web",
      est.location?.id ?? "us",
      est.size?.id ?? "medium",
      est.quality?.id ?? "standard",
    );
  };

  const loadHistoryEntry = (entry: HistoryEntry) => {
    if (entry.type === "estimate") {
      const est = refreshEstimate(entry.data as EstimateResult);
      setDescription(est.description);
      setCategoryId(est.category.id);
      setSelectedCustom(null);
      setLocationId(est.location.id);
      setSizeId(est.size.id);
      setQualityId(est.quality.id);
      setEstimate(est);
      setStage("complete");
      setLoadedDraftId(null);
      window.setTimeout(() => scrollToSection("estimate-result"), 80);
    } else {
      const draftData = entry.data;
      // Auto-saved draft mein full EstimateResult hota hai
      if ("projectTitle" in draftData) {
        const est = refreshEstimate(draftData as EstimateResult);
        setDescription(est.description);
        setCategoryId(est.category.id);
        setLocationId(est.location.id);
        setSizeId(est.size.id);
        setQualityId(est.quality.id);
        setEstimate(est);
        setStage("complete");
        setQuoteItems(est.items);
        setLoadedDraftId(entry.id);
        setQuoteOpen(true);
      } else {
        const draft = draftData as { items: EstimateItem[]; businessName: string; customerName: string };
        setQuoteItems(draft.items);
        setLoadedDraftId(entry.id);
        setQuoteOpen(true);
      }
    }
  };

  const deleteHistoryEntry = (id: string) => {
    const updated = history.filter((e) => e.id !== id);
    setHistory(updated);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  };

  const activeStep = stage === "describe" ? 0 : stage === "questions" ? 1 : 2;
  const descriptionReady = description.trim().length >= 12;

  return (
    <main
      id="top"
      className="min-h-screen overflow-x-hidden bg-[#f8f8fb] text-[#1d1b24]"
    >
      <Header
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={() => setMobileMenuOpen((open) => !open)}
        onCloseMobileMenu={() => setMobileMenuOpen(false)}
        onEstimateClick={resetEstimate}
        history={history}
        onLoadHistory={loadHistoryEntry}
        onDeleteHistory={deleteHistoryEntry}
        onClearHistory={clearHistory}
      />

      <Hero
        stage={stage}
        activeStep={activeStep}
        description={description}
        categoryId={categoryId}
        locationId={locationId}
        sizeId={sizeId}
        qualityId={qualityId}
        questionStep={questionStep}
        estimate={estimate}
        descriptionReady={descriptionReady}
        selectedCategory={selectedCategory}
        selectedLocation={selectedLocation}
        onDescriptionChange={setDescription}
        autoCategoryHint={categoryManual ? null : autoCategory}
        aiCategoryLabel={categoryManual ? null : aiCategoryLabel}
        customDescription={customDescription}
        onCategoryChange={(id) => {
          setCategoryId(id);
          setSelectedCustom(null);
          setCategoryManual(true);
          setAutoCategory(null);
        }}
        onCustomDescriptionChange={(value) => {
          setCustomDescription(value);
          setCustomSummary("");
        }}
        onAnalyzeCustom={analyzeCustomProject}
        analyzing={analyzing}
        customProjectTypes={customProjectTypes}
        selectedCustom={selectedCustom}
        onSelectCustomType={selectCustomType}
        onRemoveCustomType={removeCustomProjectType}
        customSummary={customSummary}
        onLocationChange={(id) => {
          setLocationId(id);
          setLocationSelectedManually(true);
          setCurrencyOverride(null);
        }}
        onSizeChange={setSizeId}
        onQualityChange={setQualityId}
        onSubmitDescription={beginEstimate}
        onBack={() => {
          if (questionStep === 0) {
            setStage("describe");
          } else {
            setQuestionStep(0);
          }
        }}
        onContinueQuestions={continueQuestions}
        isGenerating={isGenerating}
        onViewEstimate={() => scrollToSection("estimate-result")}
        onNewEstimate={resetEstimate}
      />

      {estimate && (
        <EstimateResultSection
          estimate={estimate}
          onSave={saveEstimate}
          onShare={shareEstimate}
          onOpenQuotation={openQuotation}
          onNewEstimate={resetEstimate}
        />
      )}

      <ServicesSection onChooseCategory={chooseCategory} />

      <HowItWorks />

      <WhyCostCalc onEstimateClick={() => scrollToSection("estimator")} />

      <CtaSection onEstimateClick={() => scrollToSection("estimator")} />

      <Footer />

      {quoteOpen && estimate && (
        <QuoteModal
          estimate={estimate}
          items={quoteItems}
          onChange={setQuoteItems}
          onClose={() => {
            setQuoteOpen(false);
            setLoadedDraftId(null);
          }}
          notify={notify}
          onSaveDraft={saveDraft}
          isEditingDraft={loadedDraftId !== null}
        />
      )}

      {shareOpen && estimate && (
        <ShareModal
          estimate={estimate}
          shareUrl={buildShareUrl()}
          onClose={() => setShareOpen(false)}
          notify={notify}
          onDownloadPdf={openQuotation}
        />
      )}
      <Toast message={toast} />
      <Toast message={errorToast} error />

      <GeneratingOverlay showing={isGenerating} />
    </main>
  );
}