"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";

interface NavItem {
  label: string;
  href: string;
}

interface NavigationProps {
  items: NavItem[];
  brandHref: string;
}

export function Navigation({ items, brandHref }: NavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="flex items-center justify-between px-6 md:px-10 py-5 border-b border-[var(--color-border)]">
      <Link href={brandHref} className="text-heading-md">
        Cairn
      </Link>
      <div className="hidden md:flex items-center gap-8">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "text-mono-md",
              pathname === item.href
                ? "text-[var(--color-text-primary)]"
                : "text-[var(--color-text-tertiary)]"
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>
      <button onClick={handleLogout} className="text-mono-md text-[var(--color-text-tertiary)]">
        Log out
      </button>
    </nav>
  );
}
