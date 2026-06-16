"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Home, List, Plus } from "lucide-react";
import { MirabeeLogo } from "@/components/brand/mirabee-logo";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/expenses", label: "Expenses", icon: List },
  { href: "/expenses/new", label: "Add", icon: Plus, highlight: true },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <MirabeeLogo size="sm" />
          <p className="text-xs font-medium text-muted-foreground">
            Expense Tracker
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-24 pt-6">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-around px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/expenses"
                ? pathname === "/expenses"
                : pathname === item.href;

            if (item.highlight) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex -mt-6 h-14 w-14 items-center justify-center rounded-full bg-accent-rose text-white shadow-lg shadow-accent-rose/30 transition-transform hover:scale-105"
                  aria-label="Add expense"
                >
                  <Icon className="h-6 w-6" />
                </Link>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg px-3 py-1 text-xs font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}