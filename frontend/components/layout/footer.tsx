export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-border/40 bg-zinc-950/20 py-8 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Identity Signature */}
        <div className="text-center md:text-left">
          <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            CyberShield AI Platform
          </p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            Indian Currency Authenticity & Counterfeit Scanning System.
          </p>
        </div>

        {/* Status / Compliance metadata */}
        <div className="text-center md:text-right">
          <p className="text-xs text-muted-foreground/60">
            &copy; {currentYear} CyberShield. All rights reserved.
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground/40 font-mono tracking-widest uppercase">
            Secured Node // Phase 1 Active
          </p>
        </div>
      </div>
    </footer>
  );
}
export default Footer;
