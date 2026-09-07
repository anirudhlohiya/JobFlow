"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  PlusCircle,
  ListChecks,
  Send,
  Settings,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/new", label: "New Application", icon: PlusCircle },
  { href: "/applications", label: "Applications", icon: ListChecks },
  { href: "/outreach", label: "Cold Outreach", icon: Send },
  { href: "/settings", label: "Settings", icon: Settings },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <>
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
            onClick={onNavigate}
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
    </>
  );
}

export function AppSidebar() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const previous = document.body.style.overflow;
    if (open) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between border-b border-hairline bg-canvas/95 backdrop-blur px-4 h-[52px] shrink-0">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-ink text-white flex items-center justify-center text-sm font-semibold">
            JF
          </div>
          <span className="font-semibold tracking-tight text-ink">JobFlow</span>
        </Link>
        <button
          onClick={() => setOpen(true)}
          aria-label="Open navigation menu"
          className="w-9 h-9 inline-flex items-center justify-center rounded-md text-ink hover:bg-hairline-soft"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-ink/30"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <aside className="absolute left-0 top-0 bottom-0 w-[280px] bg-canvas border-r border-hairline flex flex-col shadow-xl">
            <div className="px-5 pt-5 pb-4 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
                <div className="w-7 h-7 rounded-full bg-ink text-white flex items-center justify-center text-sm font-semibold">
                  JF
                </div>
                <span className="font-semibold tracking-tight text-ink">JobFlow</span>
              </Link>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close navigation menu"
                className="w-9 h-9 -mr-1 inline-flex items-center justify-center rounded-md text-mute hover:bg-hairline-soft"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="px-3 flex flex-col gap-0.5 flex-1">
              <NavLinks onNavigate={() => setOpen(false)} />
            </nav>
            <div className="px-5 py-4 text-[12px] leading-4 text-mute border-t border-hairline">
              <span className="font-mono uppercase tracking-wide">v0.1.0</span>
            </div>
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-[220px] shrink-0 border-r border-hairline bg-canvas sticky top-0 h-screen flex-col">
        <div className="px-5 pt-5 pb-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-ink text-white flex items-center justify-center text-sm font-semibold">
              JF
            </div>
            <span className="font-semibold tracking-tight text-ink">JobFlow</span>
          </Link>
        </div>

        <nav className="px-3 flex flex-col gap-0.5 flex-1">
          <NavLinks />
        </nav>

        <div className="px-5 py-4 text-[12px] leading-4 text-mute border-t border-hairline">
          <span className="font-mono uppercase tracking-wide">v0.1.0</span>
        </div>
      </aside>
    </>
  );
}