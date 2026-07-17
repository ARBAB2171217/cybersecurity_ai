"use client";

import Link from "next/link";
import { Shield, Menu, X } from "lucide-react";
import { useState } from "react";
import { ROUTES } from "@/lib/constants";

interface HeaderProps {
  onOpenLogin?: () => void;
  onOpenRegister?: () => void;
}

export function Header({ onOpenLogin, onOpenRegister }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleLoginClick = (e: React.MouseEvent) => {
    if (onOpenLogin) {
      e.preventDefault();
      onOpenLogin();
    }
  };

  const handleRegisterClick = (e: React.MouseEvent) => {
    if (onOpenRegister) {
      e.preventDefault();
      onOpenRegister();
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full glass border-b border-border/40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <Link href={ROUTES.HOME} className="text-lg font-bold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              CyberShield <span className="text-primary font-semibold">AI</span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <Link href={ROUTES.HOME} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Home
            </Link>
            <Link 
              href={ROUTES.LOGIN} 
              onClick={handleLoginClick}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Portal Access
            </Link>
            <Link
              href={ROUTES.REGISTER}
              onClick={handleRegisterClick}
              className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(37,99,235,0.25)]"
            >
              Request Access
            </Link>
          </nav>

          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-muted-foreground hover:text-foreground focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-lg px-4 py-4 flex flex-col gap-4">
          <Link
            href={ROUTES.HOME}
            onClick={() => setIsOpen(false)}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Home
          </Link>
          <Link
            href={ROUTES.LOGIN}
            onClick={(e) => {
              setIsOpen(false);
              handleLoginClick(e);
            }}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Portal Access
          </Link>
          <Link
            href={ROUTES.REGISTER}
            onClick={(e) => {
              setIsOpen(false);
              handleRegisterClick(e);
            }}
            className="w-full text-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all"
          >
            Request Access
          </Link>
        </div>
      )}
    </header>
  );
}
export default Header;
