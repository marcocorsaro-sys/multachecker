import type { Metadata } from "next";
import { Instrument_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const sans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "MultaCheck — Analizza e contesta le tue multe",
    template: "%s | MultaCheck",
  },
  description:
    "Scopri gratuitamente se puoi contestare la tua multa. Carica una foto del verbale e ricevi un'analisi AI in pochi secondi.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://multacheck.it"
  ),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it" className={`${sans.variable} ${mono.variable} dark`}>
      <body className="bg-background text-foreground font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
