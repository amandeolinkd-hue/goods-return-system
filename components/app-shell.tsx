import { NavLinks, type NavItem } from "@/components/nav-links";
import { SignOutButton } from "@/components/sign-out-button";
import { ROLE_LABELS, type Role } from "@/lib/roles";
import type { SessionUser } from "@/lib/rbac";

const NAV: (NavItem & { roles: Role[] })[] = [
  { href: "/dashboard", label: "Dashboard", roles: ["admin", "kalbadevi", "bhiwandi"] },
  { href: "/returns/new", label: "New Return", roles: ["admin", "kalbadevi"] },
  { href: "/returns", label: "All Returns", roles: ["admin", "kalbadevi", "bhiwandi"] },
  { href: "/receiving", label: "Receiving", roles: ["admin", "bhiwandi"] },
  { href: "/reports", label: "Reports", roles: ["admin", "kalbadevi", "bhiwandi"] },
  { href: "/admin/users", label: "Users", roles: ["admin"] },
  { href: "/admin/master-data", label: "Master Data", roles: ["admin"] },
];

export function AppShell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  const items = NAV.filter((n) => n.roles.includes(user.role));

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex h-14 items-center justify-between gap-4">
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-base font-bold tracking-tight">LD SILK MILLS</span>
              <span className="hidden sm:inline text-xs text-muted-foreground border-l border-border pl-2">
                Goods Return
              </span>
            </div>
            <div className="flex items-center gap-4 min-w-0">
              <div className="hidden md:block min-w-0">
                <NavLinks items={items} />
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="hidden sm:block text-right leading-tight">
                  <div className="text-sm font-medium">{user.name ?? user.email}</div>
                  <div className="text-xs text-muted-foreground">{ROLE_LABELS[user.role]}</div>
                </div>
                <SignOutButton />
              </div>
            </div>
          </div>
          {/* Mobile nav */}
          <div className="md:hidden pb-2">
            <NavLinks items={items} />
          </div>
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
