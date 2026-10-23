import CtaBanner from "@/components/CtaBanner";
import { AnimationSection } from "@/components/home/AnimationSection";
import { HomeExperience } from "@/components/home/HomeExperience";
import { HowItWorks } from "@/components/home/HowItWorks";
import { ImageCarousel } from "@/components/home/ImageCarousel";
import { ServicesSection } from "@/components/home/ServicesSection";
import { WhyCostCalc } from "@/components/home/WhyCostCalc";
import { Footer } from "@/components/layout/Footer";

// The page itself is a server component. Only the estimator, chat and modals
// need client JavaScript; the marketing sections below render on the server.
export default function Home() {
  return (
    <HomeExperience
      services={<ServicesSection />}
      carousel={<ImageCarousel />}
      animation={<AnimationSection />}
      howItWorks={<HowItWorks />}
      whyCostCalc={<WhyCostCalc />}
      cta={
        <div className="mx-auto mt-10 mb-10 max-w-[1350px] px-5 sm:px-7">
          <CtaBanner primaryHref="/#estimator" />
        </div>
      }
      footer={<Footer />}
    />
  );
}
