import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  FolderOpen,
  Stamp,
  FileText,
  Hotel,
  Building2,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { NCAA_LOGO_URL } from "@/lib/assets";
import { ROLE_LABEL } from "@/lib/domain";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  show?: (u: { isProtocol: boolean; isAdmin: boolean; isApprover: boolean }) => boolean;
};

const NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/requests", label: "Case files", icon: FolderOpen },
  {
    to: "/approvals",
    label: "Approvals",
    icon: Stamp,
    show: (u) => u.isApprover || u.isProtocol,
  },
  { to: "/documents", label: "Memos & letters", icon: FileText, show: (u) => u.isProtocol },
  { to: "/logistics", label: "Logistics", icon: Hotel, show: (u) => u.isProtocol },
  { to: "/agencies", label: "Travel agencies", icon: Building2, show: (u) => u.isProtocol },
  { to: "/staff", label: "Staff directory", icon: Users, show: (u) => u.isProtocol },
  { to: "/admin", label: "Administration", icon: Settings, show: (u) => u.isAdmin },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { data: me } = useCurrentUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  const flags = {
    isProtocol: me?.isProtocol ?? false,
    isAdmin: me?.isAdmin ?? false,
    isApprover: me?.isApprover ?? false,
  };
  const items = NAV.filter((i) => !i.show || i.show(flags));

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const sidebar = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-4">
        <img
          src={NCAA_LOGO_URL}
          alt="Nigeria Civil Aviation Authority coat of arms"
          className="h-10 w-10 shrink-0 object-contain"
        />
        <div className="leading-tight">
          <p className="font-serif text-base font-semibold">Protocol Desk</p>
          <p className="text-[11px] tracking-wide text-sidebar-foreground/70 uppercase">
            NCAA · Office of the DGCA
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {items.map((item) => {
          const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground shadow-[inset_3px_0_0_0_var(--sidebar-primary)]"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground">
            {initials(me?.fullName)}
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-medium">{me?.fullName ?? "…"}</p>
            <p className="truncate text-xs text-sidebar-foreground/70">
              {ROLE_LABEL[me?.primaryRole ?? "staff"]}
            </p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="mt-3 flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="fixed inset-y-0 w-64">{sidebar}</div>
      </aside>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-64">{sidebar}</div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Open menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              NCAA Protocol Desk
            </p>
            <p className="truncate text-xs text-muted-foreground">
              Official travel, visa, ticket and logistics desk
            </p>
          </div>
          {me?.staffIdNumber ? (
            <span className="ref-no hidden rounded border border-border bg-muted px-2 py-1 text-xs text-muted-foreground sm:inline">
              {me.staffIdNumber}
            </span>
          ) : null}
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
