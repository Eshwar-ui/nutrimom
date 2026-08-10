import { privateMetadata } from "@/lib/seo";

// Also noindex because the URL carries a single-use reset token in its query.
export const metadata = privateMetadata("Choose a new password");

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
