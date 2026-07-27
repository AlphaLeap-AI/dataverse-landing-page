import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Source_Serif_4 } from "next/font/google";

import { DemoCta } from "@/features/landing/demo-cta";
import { EcosystemSection } from "@/features/landing/ecosystem-section";
import { Journey } from "@/features/landing/journey";
import styles from "@/features/landing/landing.module.css";
import { NavBar } from "@/features/landing/nav-bar";
import { PlatformSection } from "@/features/landing/platform-section";
import { ProofSection } from "@/features/landing/proof-section";
import { FloatingCta } from "@/features/landing/ui/floating-cta";
import { getMetadataBase, getSiteUrl, siteName } from "@/lib/site";

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-source-serif",
  display: "swap",
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-plex-sans",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

const pageTitle = "Dataverse | Ask Anything. Trust the Answer.";
const pageDescription =
  "Dataverse is the enterprise data agent that plugs into every database you own, grounds each question in your approved schema, and returns SQL-backed answers in seconds — inside your network.";

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: pageTitle,
  description: pageDescription,
  keywords: [
    "enterprise data agent",
    "AI data agent for databases",
    "enterprise text-to-SQL",
    "database AI agent",
    "data agent with connectors",
    "schema-aware analytics",
    "SQL-backed answers",
    "multi-database data agent",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: "/",
    siteName,
    locale: "en_US",
    type: "website",
    // Raster only — WhatsApp/iMessage/Slack ignore SVG og:image.
    images: [
      {
        url: "/dataverse-social-card.jpg",
        width: 1200,
        height: 630,
        type: "image/jpeg",
        alt: "Dataverse — Ask anything. Trust the answer.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle,
    description: pageDescription,
    images: ["/dataverse-social-card.jpg"],
  },
};

export default function Home() {
  const siteUrl = getSiteUrl();
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: siteName,
        url: siteUrl,
        description: pageDescription,
      },
      {
        "@type": "SoftwareApplication",
        name: siteName,
        url: siteUrl,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description: pageDescription,
        featureList: [
          "Natural-language querying across every database",
          "Schema-aware retrieval",
          "Enterprise text-to-SQL",
          "Generated SQL inspection",
          "Metadata review workflow",
          "17+ LLM providers — cloud, open-weight, or fully local",
          "MCP tool connectors with per-user OAuth",
          "Private deployment in your VPC or air-gapped",
        ],
        audience: {
          "@type": "Audience",
          audienceType: "Enterprise data teams",
        },
      },
    ],
  };

  return (
    <div className={`${styles.root} ${sourceSerif.variable} ${ibmPlexSans.variable} ${ibmPlexMono.variable}`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <NavBar />

      <main>
        <Journey />
        <div className={styles.solid}>
          <EcosystemSection />
          <PlatformSection />
          <ProofSection />
        </div>
        {/* Sticky full-viewport conversion — the finale. The footer is
            docked inside its pinned panel so the page ends on the pin. */}
        <DemoCta />
      </main>

      <FloatingCta />
    </div>
  );
}
