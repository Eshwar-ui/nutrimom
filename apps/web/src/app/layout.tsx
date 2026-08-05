import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { AppChrome } from "@/components/app-chrome";
import { Toaster } from "@/components/toaster";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

// Without this, any relative image in an openGraph block (e.g. a blog cover)
// can't be resolved to the absolute URL that social crawlers require.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:4000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "The Nurture Moms — Preloved baby & maternity marketplace",
    template: "%s · The Nurture Moms",
  },
  description:
    "Buy, sell, and donate gently used baby and maternity products. A trusted marketplace for mothers.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${outfit.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Providers>
          <AppChrome>{children}</AppChrome>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
