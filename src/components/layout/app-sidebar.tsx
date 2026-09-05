"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  PlusCircle,
  ListChecks,
  Send,
  Settings,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/new", label: "New Application", icon: PlusCircle },
  { href: "/applications", label: "Applications", icon: ListChecks },
  { href: "/outreach", label: "Cold Outreach", icon: Send },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[220px] shrink-0 border-r border-hairline bg-canvas sticky top-0 h-screen flex flex-col">
      <div className="px-5 pt-5 pb-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-ink text-white flex items-center justify-center text-sm font-semibold">
            JF
          </div>
          <span className="font-semibold tracking-tight text-ink">JobFlow</span>
        </Link>
      </div>

      <nav className="px-3 flex flex-col gap-0.5 flex-1">
        {navItems.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-[14px] leading-5 transition-colors",
                active
                  ? "bg-white text-ink border border-hairline font-medium shadow-[0px_1px_1px_rgba(0,0,0,0.04)]"
                  : "text-body hover:text-ink hover:bg-hairline-soft"
              )}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-4 text-[12px] leading-4 text-mute border-t border-hairline">
        <span className="font-mono uppercase tracking-wide">v0.1.0</span>
      </div>
    </aside>
  );
}