import { AccountShell } from "@/components/account-shell";
import { privateMetadata } from "@/lib/seo";

export const metadata = privateMetadata("Your account");

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <AccountShell>{children}</AccountShell>;
}
