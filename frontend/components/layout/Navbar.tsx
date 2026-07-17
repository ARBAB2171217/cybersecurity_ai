"use client";

import { useAuth } from "@/hooks/useAuth";
import { Shield, LogOut, User, Search, Settings } from "lucide-react";
import Link from "next/link";
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/DropdownMenu";
import { Avatar } from "@/components/ui/Avatar";
import { ROUTES } from "@/lib/constants";
import { ThemeToggle } from "@/components/common/ThemeToggle";

export function Navbar() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = ROUTES.LOGIN;
  };

  return (
    <nav className="h-16 w-full glass border-b border-border/40 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6 text-primary drop-shadow-[0_2px_8px_rgba(79,124,255,0.4)]" />
        <Link href={ROUTES.HOME} className="text-lg font-semibold tracking-tight text-foreground">
          CyberShield <span className="text-primary font-medium">AI</span>
        </Link>
      </div>

      <div className="hidden md:flex flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search reports by ID, URL, or Threat Level..."
            className="w-full h-9 bg-surface border border-border shadow-[0_2px_8px_rgba(0,0,0,0.2)] rounded-full pl-9 pr-4 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-foreground placeholder:text-muted"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const val = e.currentTarget.value;
                if (val) window.location.href = `${ROUTES.REPORTS}?search=${encodeURIComponent(val)}`;
              }
            }}
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <ThemeToggle />
        
        {user && (
          <DropdownMenu
            trigger={
              <button className="flex items-center gap-2 focus:outline-none">
                <Avatar size="sm" fallback={(user.fullName || "User").substring(0, 2).toUpperCase()} />
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-semibold text-foreground">{user.fullName || "User"}</span>
                  <span className="text-[10px] text-muted-foreground capitalize">{"role" in user ? (user as any).role : "Citizen"}</span>
                </div>
              </button>
            }
          >
            <Link href={ROUTES.PROFILE} className="w-full">
              <DropdownMenuItem className="cursor-pointer">
                <User className="h-4 w-4 mr-2" /> Profile
              </DropdownMenuItem>
            </Link>
            <Link href={ROUTES.SETTINGS} className="w-full">
              <DropdownMenuItem className="cursor-pointer">
                <Settings className="h-4 w-4 mr-2" /> Settings
              </DropdownMenuItem>
            </Link>
            <DropdownMenuItem onClick={handleLogout} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
              <LogOut className="h-4 w-4 mr-2" /> Sign Out
            </DropdownMenuItem>
          </DropdownMenu>
        )}
      </div>
    </nav>
  );
}
export default Navbar;
