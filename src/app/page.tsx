import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Source_Serif_4 } from "next/font/google";

import { DemoCta } from "@/features/landing/demo-cta";
import { Footer } from "@/features/landing/footer";
import { GalaxyStory } from "@/features/landing/galaxy-story";
import styles from "@/features/landing/landing.module.css";
import { NavBar } from "@/features/landing/nav-bar";
import { PlatformSection } from "@/features/landing/platform-section";
import { ProofSection } from "@/features/landing/proof-section";
import { getMetadataBase, getSiteUrl, siteName } from "@/lib/site";

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
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

const pageTitle = "Dataverse | Enterprise Data Agent for Grounded Database Answers";
const pageDescription =
  "Dataverse is an enterprise data agent that connects to your databases, grounds answers in approved schema context, and returns SQL-backed results your team can inspect.";

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
    images: [
      {
        url: "/dataverse-social-card.svg",
        width: 1200,
        height: 630,
        alt: "Dataverse enterprise data agent social preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle,
    description: pageDescription,
    images: ["/dataverse-social-card.svg"],
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
          "Schema-aware retrieval",
          "Enterprise text-to-SQL",
          "Generated SQL inspection",
          "Metadata review workflow",
          "Reusable dashboard views",
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
        <GalaxyStory />
        <div className={styles.postStory}>
          <PlatformSection />
          <ProofSection />
          {/* Final scroll frame: CTA + footer fill one viewport at page end. */}
          <div className={styles.finalFrame}>
            <DemoCta />
            <Footer />
          </div>
        </div>
      </main>
    </div>
  );
}
