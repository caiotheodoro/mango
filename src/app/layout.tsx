import type { Metadata } from "next";
import { Instrument_Serif, Figtree } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument-serif",
  display: "swap",
});

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Brazilian Mango Expert | Adopt AI",
  description: "Ask anything about Brazilian mangos - varieties, seasons, nutrition, exports, and more. Powered by AI with verified data sources.",
  keywords: ["brazilian mangos", "mango varieties", "tommy atkins", "palmer mango", "brazil agriculture", "mango export"],
  authors: [{ name: "Adopt AI" }],
  openGraph: {
    title: "Brazilian Mango Expert | Adopt AI",
    description: "Your AI expert on Brazilian mangos",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${instrumentSerif.variable} ${figtree.variable}`}>
      <body className="min-h-screen antialiased bg-[var(--color-page-bg)]" style={{ fontFamily: "var(--font-body)" }}>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
