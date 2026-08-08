import { Hero } from "@/components/landing/Hero";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { SolutionFlow } from "@/components/landing/SolutionFlow";
import { LiveDemoWidget } from "@/components/landing/LiveDemoWidget";
import { ValueSplit } from "@/components/landing/ValueSplit";
import { InsuranceCalculator } from "@/components/landing/InsuranceCalculator";
import { TechArchitecture } from "@/components/landing/TechArchitecture";
import { MarketOpportunity } from "@/components/landing/MarketOpportunity";
import { BuiltWith } from "@/components/landing/BuiltWith";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <>
      <Hero />
      <ProblemSection />
      <SolutionFlow />
      <LiveDemoWidget />
      <ValueSplit />
      <InsuranceCalculator />
      <TechArchitecture />
      <MarketOpportunity />
      <BuiltWith />
      <Footer />
    </>
  );
}
