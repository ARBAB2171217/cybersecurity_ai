"use client";

import { useAuth } from "@/hooks/useAuth";
import { LayoutDashboard, FileText, Scan, ShieldAlert, Settings, Users, Bookmark } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function Sidebar() {
  const { user, isAdmin } = useAuth();
  const pathname = usePathname();

  // Bug fix: routes were pointing to /dashboard/scan and /dashboard/reports
  // which don't exist. They now correctly reference ROUTES.DETECT (/detect-note)
  // and ROUTES.REPORTS (/reports) from the single source-of-truth constants file.
  const citizenLinks: SidebarItem[] = [
    { label: "Dashboard", href: ROUTES.DASHBOARD, icon: LayoutDashboard },
    { label: "Universal AI Scanner", href: ROUTES.DETECT, icon: Scan },
    { label: "URL Intelligence", href: ROUTES.URL_INTELLIGENCE, icon: FileText },
    { label: "Reports History", href: ROUTES.REPORTS, icon: FileText },
    { label: "Community", href: ROUTES.COMMUNITY, icon: Users },
    { label: "Bookmarks", href: ROUTES.BOOKMARKS, icon: Bookmark },
    { label: "Analytics", href: ROUTES.ANALYTICS, icon: LayoutDashboard },
    { label: "Profile", href: ROUTES.PROFILE, icon: Users },
    { label: "Settings", href: ROUTES.SETTINGS, icon: Settings },
  ];

  const adminLinks: SidebarItem[] = [
    { label: "Overview", href: ROUTES.ADMIN.DASHBOARD, icon: LayoutDashboard },
    { label: "Incident Reports", href: ROUTES.ADMIN.REPORTS, icon: ShieldAlert },
    { label: "System Config", href: ROUTES.ADMIN.ANALYTICS, icon: Settings },
  ];

  const links = isAdmin ? adminLinks : citizenLinks;

  return (
    <aside className="w-64 shrink-0 h-[calc(100vh-64px)] border-r border-border bg-surface p-4 hidden md:flex flex-col gap-6 justify-between shadow-[4px_0_24px_rgba(0,0,0,0.2)]">
      <div className="flex flex-col gap-1.5">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.label}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-300",
                isActive
                  ? "bg-primary text-primary-foreground shadow-[0_2px_12px_rgba(79,124,255,0.25)] scale-[1.02]"
                  : "text-muted hover:bg-white/5 hover:text-foreground"
              )}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </div>

      <div className="flex flex-col gap-1.5 border-t border-border/40 pt-4">
      </div>
    </aside>
  );
}
export default Sidebar;
