import { Geist, Geist_Mono } from "next/font/google";

// One family for display and body, its mono sibling for code and labels.
// Declared once for the landing page and both legal routes — next/font
// requires module scope, so it cannot live inside a component.

const geist = Geist({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-geist",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-geist-mono",
  display: "swap",
});

/** Class name exposing both font CSS variables. */
export const fontClassName = `${geist.variable} ${geistMono.variable}`;
