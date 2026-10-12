import { privateMetadata } from "@/lib/seo";

// Noindex: a credential form is not a search result, and it duplicates
// /register in the crawler's eyes.
export const metadata = privateMetadata(
  "Sign in",
  "Sign in to manage your Nurture Moms account, listings and orders.",
);

export default function LoginLayout({ children }: { children: React.ReactNode }) { return children; }
