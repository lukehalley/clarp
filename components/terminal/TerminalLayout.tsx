'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import SearchInput from './SearchInput';
import TerminalLoader from './TerminalLoader';
import {
  LayoutDashboard,
  Bookmark,
  Bell,
  Menu,
  X,
  ChevronRight,
  ArrowLeft,
  Radar,
  Settings,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/terminal', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { href: '/terminal/xintel', label: 'X Intel', icon: <Radar size={18} /> },
];

interface TerminalLayoutProps {
  children: React.ReactNode;
}

export default function TerminalLayout({ children }: TerminalLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [showLoader, setShowLoader] = useState(true);
  const [booted, setBooted] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  // Always play the boot animation for dramatic effect
  const handleBootComplete = () => {
    setShowLoader(false);
    setBooted(true);
  };

  // Fade out and navigate back to landing page
  const handleBackToHome = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      router.push('/');
    }, 500);
  };

  const isActive = (href: string) => {
    if (href === '/terminal') return pathname === '/terminal';
    return pathname.startsWith(href);
  };

  // Show loader on first visit
  if (showLoader && !booted) {
    return <TerminalLoader onComplete={handleBootComplete} />;
  }

  return (
    <div className="h-screen bg-slate-dark flex flex-col overflow-hidden">
      {/* Construction stripe - matches landing page */}
      <div className="construction-stripe h-3 shrink-0" />

      {/* Header */}
      <header className="shrink-0 border-b border-ivory-light/10 bg-slate-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Back + Logo + Demo + Nav */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleBackToHome}
              className="flex items-center justify-center w-8 h-8 border border-ivory-light/20 text-ivory-light/50 hover:text-ivory-light hover:border-danger-orange hover:bg-danger-orange/10 transition-all cursor-pointer"
              title="Back to home"
            >
              <ArrowLeft size={16} />
            </button>
            <Link
              href="/terminal"
              className="flex items-center gap-2 text-ivory-light font-mono font-bold text-lg"
            >
              <span className="text-danger-orange">CLARP</span>
              <span className="text-ivory-light/60">TERMINAL</span>
            </Link>
            {/* Demo Badge */}
            <div className="hidden sm:flex items-center">
              <span className="px-2 py-0.5 bg-larp-yellow/20 border border-larp-yellow/50 text-larp-yellow font-mono text-[10px] font-bold tracking-wider animate-pulse">
                DEMO
              </span>
            </div>
            {/* Desktop Nav - next to demo badge */}
            <nav className="hidden md:flex items-center gap-1 ml-2">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 font-mono text-sm transition-colors ${
                    isActive(item.href)
                      ? 'text-danger-orange bg-danger-orange/10 border border-danger-orange/30'
                      : 'text-ivory-light/70 hover:text-ivory-light hover:bg-ivory-light/5'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Search + Actions */}
          <div className="hidden md:flex items-center gap-3 flex-1 justify-end max-w-lg">
            <div className="hidden lg:block flex-1">
              <SearchInput compact />
            </div>

            {/* Watchlist Button */}
            <Link
              href="/terminal/watchlist"
              className="shrink-0 w-10 h-10 flex items-center justify-center bg-larp-yellow border-2 border-black transition-all hover:translate-x-0.5 hover:translate-y-0.5"
              style={{ boxShadow: '3px 3px 0 black' }}
              title="Watchlist"
            >
              <Bookmark size={18} className="text-black" />
            </Link>

            {/* Alerts Icon */}
            <div className="relative shrink-0">
            <button
              onClick={() => setAlertsOpen(!alertsOpen)}
              className="relative w-10 h-10 flex items-center justify-center bg-danger-orange border-2 border-black transition-all hover:translate-x-0.5 hover:translate-y-0.5"
              style={{ boxShadow: alertsOpen ? 'none' : '3px 3px 0 black' }}
              title="Alerts"
            >
              <Bell size={18} className="text-black" />
              {/* Notification dot */}
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-larp-red border border-black" />
            </button>

            {/* Alerts Dropdown */}
            {alertsOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setAlertsOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-80 bg-slate-dark border-2 border-danger-orange/50 z-50 shadow-lg">
                  <div className="p-4 border-b border-ivory-light/10">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-ivory-light">ALERTS</span>
                      <span className="px-2 py-0.5 bg-larp-red/20 text-larp-red font-mono text-xs">
                        3 NEW
                      </span>
                    </div>
                  </div>

                  {/* Alert Items */}
                  <div className="max-h-64 overflow-y-auto">
                    <div className="p-3 border-b border-ivory-light/5 hover:bg-ivory-light/5">
                      <div className="flex items-start gap-2">
                        <span className="w-2 h-2 mt-1.5 bg-larp-red shrink-0" />
                        <div>
                          <p className="font-mono text-xs text-ivory-light">
                            @cryptokol_alpha score dropped to 28
                          </p>
                          <p className="font-mono text-[10px] text-ivory-light/40 mt-1">2m ago</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 border-b border-ivory-light/5 hover:bg-ivory-light/5">
                      <div className="flex items-start gap-2">
                        <span className="w-2 h-2 mt-1.5 bg-larp-yellow shrink-0" />
                        <div>
                          <p className="font-mono text-xs text-ivory-light">
                            New backlash event for @degen_trader
                          </p>
                          <p className="font-mono text-[10px] text-ivory-light/40 mt-1">15m ago</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 border-b border-ivory-light/5 hover:bg-ivory-light/5">
                      <div className="flex items-start gap-2">
                        <span className="w-2 h-2 mt-1.5 bg-larp-green shrink-0" />
                        <div>
                          <p className="font-mono text-xs text-ivory-light">
                            @legit_builder passed all checks
                          </p>
                          <p className="font-mono text-[10px] text-ivory-light/40 mt-1">1h ago</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Configure Button */}
                  <div className="p-3 border-t border-ivory-light/10">
                    <Link
                      href="/terminal/alerts"
                      onClick={() => setAlertsOpen(false)}
                      className="flex items-center justify-center gap-2 w-full py-2 border border-ivory-light/20 text-ivory-light/70 font-mono text-xs hover:border-danger-orange hover:text-danger-orange transition-colors"
                    >
                      <Settings size={14} />
                      CONFIGURE RULES
                    </Link>
                  </div>
                </div>
              </>
            )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-ivory-light/70 hover:text-ivory-light"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-ivory-light/10 bg-slate-dark">
            <div className="p-4">
              <SearchInput />
            </div>
            <nav className="pb-4">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-4 py-3 font-mono text-sm ${
                    isActive(item.href)
                      ? 'text-danger-orange bg-danger-orange/10'
                      : 'text-ivory-light/70'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    {item.icon}
                    {item.label}
                  </span>
                  <ChevronRight size={16} className="text-ivory-light/30" />
                </Link>
              ))}
              {/* Mobile Action Buttons */}
              <div className="flex gap-3 px-4 py-3">
                <Link
                  href="/terminal/watchlist"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-larp-yellow border-2 border-black font-mono text-sm text-black font-bold"
                  style={{ boxShadow: '3px 3px 0 black' }}
                >
                  <Bookmark size={16} />
                  WATCHLIST
                </Link>
                <Link
                  href="/terminal/alerts"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-danger-orange border-2 border-black font-mono text-sm text-black font-bold"
                  style={{ boxShadow: '3px 3px 0 black' }}
                >
                  <Bell size={16} />
                  ALERTS
                </Link>
              </div>
              <div className="border-t border-ivory-light/10 mt-2 pt-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleBackToHome();
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 font-mono text-sm text-ivory-light/50 hover:text-ivory-light cursor-pointer"
                >
                  <span className="flex items-center gap-3">
                    <ArrowLeft size={18} />
                    Back to Home
                  </span>
                  <ChevronRight size={16} className="text-ivory-light/30" />
                </button>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto">
        {/* Search Bar - Mobile (below header) */}
        <div className="lg:hidden bg-slate-dark border-b border-ivory-light/10 p-4">
          <SearchInput />
        </div>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 w-full">
          {children}
        </main>
      </div>

      {/* Footer */}
      <footer className="shrink-0 border-t border-ivory-light/10 py-4 px-4 sm:px-6 bg-slate-dark">
        <div className="max-w-7xl mx-auto space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-ivory-light/40">
            <div className="flex items-center gap-2">
              <span className="text-danger-orange">CLARP</span>
              <span>Terminal v1.0</span>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={handleBackToHome} className="hover:text-ivory-light/60 transition-colors cursor-pointer">
                Home
              </button>
              <Link href="/roadmap" className="hover:text-ivory-light/60 transition-colors">
                Roadmap
              </Link>
              <a
                href="https://x.com/CLARPAgent"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-ivory-light/60 transition-colors"
              >
                @CLARPAgent
              </a>
            </div>
            <span className="text-ivory-light/30">
              <span className="text-larp-red">×</span> not financial advice. don't buy this.
            </span>
          </div>
          <p className="text-[9px] text-ivory-light/30 text-center font-mono">
            <span className="text-danger-orange">disclaimer:</span> this is a parody website for entertainment purposes only. all views expressed are my own and do not represent any employer or organization.
          </p>
        </div>
      </footer>

      {/* Fade out overlay */}
      <div
        className={`fixed inset-0 bg-black z-[150] pointer-events-none transition-opacity duration-500 ${
          isFadingOut ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}
