import type { Metadata } from "next";
import Link from "next/link";
import { AdminGate } from "@/components/admin-gate";
import { PageContainer } from "@/components/layout/page-container";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: {
    default: "Admin",
    template: "%s | Admin | Uni Pasco Hub",
  },
  robots: { index: false },
};

const adminNavItems = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/storage", label: "Storage" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/users", label: "Users" },
] as const;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGate>
      <PageContainer width="wide" className="space-y-8">
        <nav aria-label="Admin navigation" className="flex gap-1 border-b">
          {adminNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "rounded-b-none border-b-2 border-transparent px-4 pb-3 pt-2 hover:bg-transparent aria-[current=page]:border-foreground aria-[current=page]:text-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        {children}
      </PageContainer>
    </AdminGate>
  );
}
