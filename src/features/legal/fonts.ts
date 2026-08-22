import { IBM_Plex_Mono, IBM_Plex_Sans, Source_Serif_4 } from "next/font/google";

// Same three families as the landing page, declared once for both legal
// routes. next/font requires module scope, so this cannot live in the
// component itself without being re-declared per page.

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "600"],
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

/** Class name exposing all three font CSS variables. */
export const legalFontClassName = `${sourceSerif.variable} ${ibmPlexSans.variable} ${ibmPlexMono.variable}`;
