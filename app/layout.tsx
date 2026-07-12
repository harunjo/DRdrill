import type { Metadata } from "next";
import { Inter, Chivo, Chivo_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

// Body voice — Inter, a neutral workhorse that sets long ID/EN copy cleanly.
const sans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

// Readout voice — Chivo Mono, the incident-clock face: every RPO/RTO, time,
// cost, and status readout. Explicit weights (not a variable font here).
const mono = Chivo_Mono({
  variable: "--font-mono",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
});

// Display voice — Chivo, a sturdy journalistic-technical grotesque, for
// headings, verdicts, and the score. Reads "report," not generic SaaS.
const display = Chivo({
  variable: "--font-display",
  weight: ["700", "900"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "DR Drill — Business Continuity Readiness Check",
  description:
    "Describe your environment. Get your recovery reality — readiness score, RPO/RTO gaps, risk flags, and a disaster drill story. Free, bilingual (ID/EN), nothing stored.",
  metadataBase: new URL("https://drdrill.harunjonatan.com"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${sans.variable} ${mono.variable} ${display.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
