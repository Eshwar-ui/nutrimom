import type { Metadata, Viewport } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { AppChrome } from "@/components/app-chrome";
import { Toaster } from "@/components/toaster";
import {
  OG_IMAGE,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
} from "@/lib/seo";

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

export const metadata: Metadata = {
  // Without this, any relative image or url in an openGraph block (e.g. a blog
  // cover) can't be resolved to the absolute URL that crawlers require.
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE} in India`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "shopping",
  // Deliberately no `alternates.canonical` here: metadata is inherited, so a
  // canonical set on the root layout would point every page that doesn't
  // override it at the home page. Canonicals belong on the pages themselves
  // (see lib/seo `pageMetadata`).
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      // Lets Google use full-size listing photos and longer snippets rather
      // than the conservative defaults — this is a visual, photo-led catalog.
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  // Phone numbers on the site are seller contacts rendered as real links —
  // Safari's auto-detection wraps stray digits (prices, sizes) in tel: links.
  formatDetection: { telephone: false, email: false, address: false },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_IN",
    title: `${SITE_NAME} — ${SITE_TAGLINE} in India`,
    description: SITE_DESCRIPTION,
    url: "/",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${SITE_TAGLINE} in India`,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },
};

export const viewport: Viewport = {
  // Matches the light/dark `--background` tokens in globals.css so the mobile
  // browser chrome blends with the page instead of banding against it.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fdf6ee" },
    { media: "(prefers-color-scheme: dark)", color: "#1b1613" },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en-IN"
      suppressHydrationWarning
      className={`${outfit.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Providers>
          <AppChrome>{children}</AppChrome>
          <Toaster />
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
