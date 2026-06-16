import type { Metadata } from "next";

import { LandingFooter } from "@/components/marketing/landing-footer";
import { LandingHero } from "@/components/marketing/landing-hero";
import { LandingNavbar } from "@/components/marketing/landing-navbar";
import { FinalCta, FeatureGrid, PricingPreview, TrustSection, WorkflowSection } from "@/components/marketing/landing-sections";
import { ProductFlowPreview } from "@/components/marketing/product-flow-preview";

export const metadata: Metadata = {
  title: "Gradix.ng — Online Result Management System for Nigerian Schools",
  description: "Gradix helps Nigerian schools upload Excel results, publish report cards online, and let parents check results with one permanent student code.",
  openGraph: {
    title: "Gradix.ng — Online Result Management System for Nigerian Schools",
    description: "Excel result upload for schools, official report cards, and a parent result checker in one secure workspace.",
    url: "/",
    siteName: "Gradix",
    type: "website",
  },
};

export default function HomePage() {
  return (
    <div className="min-h-dvh bg-[#F8FAFC] font-sans">
      <LandingNavbar />
      <LandingHero />
      <ProductFlowPreview />
      <FeatureGrid />
      <WorkflowSection />
      <TrustSection />
      <PricingPreview />
      <FinalCta />
      <LandingFooter />
    </div>
  );
}
