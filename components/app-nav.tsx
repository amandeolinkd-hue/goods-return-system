"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PlusCircle,
  ClipboardList,
  PackageCheck,
  BarChart3,
  Users,
  Database,
  Package,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { signOutAction } from "@/app/actions/auth";
import { cn } from "@/lib/utils";
import { ROLE_LABELS, type Role } from "@/lib/roles";
import type { SessionUser } from "@/lib/rbac";

type Item = { href: string; label: string; icon: React.ComponentType<{ className?: string }>; roles: Role[] };
type Group = { label: string; items: Item[] };

const GROUPS: Group[] = [
  {
    label: "Operations",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "kalbadevi", "bhiwandi"] },
      { href: "/returns/new", label: "New Return", icon: PlusCircle, roles: ["admin", "kalbadevi"] },
      { href: "/returns", label: "All Returns", icon: ClipboardList, roles: ["admin", "kalbadevi", "bhiwandi"] },
      { href: "/receiving", label: "Receiving", icon: PackageCheck, roles: ["admin", "bhiwandi"] },
      { href: "/reports", label: "Reports", icon: BarChart3, roles: ["admin", "kalbadevi", "bhiwandi"] },
    ],
  },
  {
    label: "Admin",
    items: [
      { href: "/admin/users", label: "Users", icon: Users, roles: ["admin"] },
      { href: "/admin/master-data", label: "Master Data", icon: Database, roles: ["admin"] },
    ],
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(href + "/");
}

function initials(name?: string | null, email?: string | null) {
  const base = name?.trim() || email?.split("@")[0] || "U";
  return base
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

function SidebarBody({
  groups,
  user,
  onNavigate,
}: {
  groups: Group[];
  user: SessionUser;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-white/10">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-gradient text-white shadow">
          <Package className="h-5 w-5" />
        </div>
        <div className="leading-none">
          <div className="text-sm font-bold text-white tracking-tight">LD SILK MILLS</div>
          <div className="text-[11px] text-sidebar-muted mt-1">Goods Return</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {groups.map((group) => (
          <div key={group.label} className="space-y-1">
            <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-sidebar-muted/80">
              {group.label}
            </div>
            {group.items.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-sidebar-active text-white shadow-sm"
                      : "text-sidebar-foreground hover:bg-white/5 hover:text-white"
                  )}
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white ring-1 ring-white/15">
            {initials(user.name, user.email)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-white">{user.name ?? user.email}</div>
            <div className="text-[11px] text-sidebar-muted">{ROLE_LABELS[user.role]}</div>
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-md p-2 text-sidebar-muted hover:bg-white/5 hover:text-white transition-colors"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export function AppNav({ user }: { user: SessionUser }) {
  const [open, setOpen] = useState(false);
  const groups = GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((i) => i.roles.includes(user.role)),
  })).filter((g) => g.items.length > 0);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 z-30">
        <SidebarBody groups={groups} user={user} />
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card/90 backdrop-blur px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gradient text-white">
            <Package className="h-4 w-4" />
          </div>
          <span className="text-sm font-bold tracking-tight">LD SILK MILLS</span>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="rounded-md p-2 text-muted-foreground hover:bg-muted"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85%] shadow-2xl animate-fade-in">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-3 top-4 z-10 rounded-md p-1.5 text-sidebar-muted hover:bg-white/10 hover:text-white"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarBody groups={groups} user={user} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
