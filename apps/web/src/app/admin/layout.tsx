import { AdminShell } from "@/components/admin-shell";
import { privateMetadata } from "@/lib/seo";

export const metadata = privateMetadata("Admin");

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
