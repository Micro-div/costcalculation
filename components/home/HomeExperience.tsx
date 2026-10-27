"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { GeneratingOverlay } from "@/components/common/GeneratingOverlay";
import { Toast } from "@/components/common/Toast";
import { EstimateResultSection } from "@/components/home/EstimateResult";
import { Estimator } from "@/components/home/Estimator";
import { HeroIntro } from "@/components/home/HeroIntro";
import { useEstimateStudio } from "@/components/home/useEstimateStudio";
import { Header } from "@/components/layout/Header";
import { QuoteModal } from "@/components/quotation/QuoteModal";
import { ShareModal } from "@/components/share/ShareModal";
import { countries, locations } from "@/constants";
import { scrollToSection } from "@/lib";
import type { EstimateResult } from "@/types";

interface HomeExperienceProps {
  /** Server-rendered static sections, placed between the interactive areas. */
  services: ReactNode;
  carousel: ReactNode;
  animation: ReactNode;
  howItWorks: ReactNode;
  whyCostCalc: ReactNode;
  cta: ReactNode;
  footer: ReactNode;
}

/**
 * Owns everything interactive on the home page. The static marketing sections
 * are passed in as slots so they stay server components and ship no client JS.
 */
export function HomeExperience({
  services,
  carousel,
  animation,
  howItWorks,
  whyCostCalc,
  cta,
  footer,
}: HomeExperienceProps) {
  const studio = useEstimateStudio();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [titleAnimDone, setTitleAnimDone] = useState(false);

  useEffect(() => {
    const onTitleDone = () => setTitleAnimDone(true);
    window.addEventListener("costcalc:hero-title-done", onTitleDone);
    return () =>
      window.removeEventListener("costcalc:hero-title-done", onTitleDone);
  }, []);

  return (
    <>
      <Header
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={() => setMobileMenuOpen((open) => !open)}
        onCloseMobileMenu={() => setMobileMenuOpen(false)}
        onEstimateClick={studio.resetEstimate}
        history={studio.history}
        onLoadHistory={studio.loadHistoryEntry}
        onDeleteHistory={studio.deleteHistoryEntry}
        onClearHistory={studio.clearHistory}
      />

      <main
        id="top"
        className="min-h-screen overflow-x-hidden bg-[#f8f8fb] text-[#1d1b24]"
      >
        {studio.shareError && (
          <div
            role="alert"
            className="border-b border-[#f0c9cf] bg-[#fff5f6] px-5 py-3 text-center text-sm font-semibold text-[#8a2432]"
          >
            {studio.shareError}
          </div>
        )}

        <HeroIntro
          estimator={
            <Estimator
              stage={studio.stage}
              activeStep={studio.activeStep}
              description={studio.description}
              categoryId={studio.categoryId}
              locationId={studio.locationId}
              sizeId={studio.sizeId}
              qualityId={studio.qualityId}
              estimate={studio.estimate}
              needsInfo={studio.needsInfo}
              descriptionReady={studio.descriptionReady}
              selectedCategory={studio.selectedCategory}
              selectedLocation={studio.selectedLocation}
              onDescriptionChange={studio.changeDescription}
              onCategoryChange={studio.changeCategory}
              onLocationChange={studio.changeLocation}
              onSizeChange={studio.changeSize}
              onQualityChange={studio.changeQuality}
              onSubmitDescription={studio.beginEstimate}
              onSubmitDetails={studio.confirmDetails}
              onBackToDescription={studio.backToDescription}
              isPreparingDetails={studio.isPreparingDetails}
              isGenerating={studio.isGenerating}
              estimateError={studio.estimateError}
              onRetryEstimate={studio.retryEstimate}
              onViewEstimate={() => scrollToSection("estimate-result")}
            />
          }
        />

        {services}

        {carousel}

        {animation}

        {studio.estimate && (
          <EstimateResultSection
            estimate={studio.estimate}
            onSave={studio.saveEstimate}
            onShare={studio.shareEstimate}
            onOpenQuotation={studio.openQuotation}
            onNewEstimate={studio.resetEstimate}
          />
        )}

        {howItWorks}

        {whyCostCalc}

        {cta}

        {footer}

        {studio.quoteOpen && (studio.quoteEstimate ?? studio.estimate) && (
          <QuoteModal
            estimate={
              (studio.quoteEstimate ?? studio.estimate) as EstimateResult
            }
            items={studio.quoteItems}
            onChange={studio.setQuoteItems}
            onClose={studio.closeQuote}
            notify={studio.notify}
            onSaveDraft={studio.saveDraft}
            isEditingDraft={studio.loadedDraftId !== null}
          />
        )}

        {studio.shareOpen && studio.estimate && (
          <ShareModal
            estimate={studio.estimate}
            shareUrl={studio.buildShareUrl()}
            onClose={() => studio.setShareOpen(false)}
            notify={studio.notify}
            onDownloadPdf={studio.openQuotation}
          />
        )}
        <Toast message={studio.toast} />
        <Toast message={studio.errorToast} error />

        <GeneratingOverlay showing={studio.isGenerating} />
      </main>

      <ChatWidget
        countries={countries}
        locations={locations}
        onCreateEstimate={studio.createEstimateFromChat}
        bounceOnTitleEnd={titleAnimDone}
      />
    </>
  );
}
