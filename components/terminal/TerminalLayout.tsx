'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import SearchInput from './SearchInput';
import TerminalLoader from './TerminalLoader';
import {
  LayoutDashboard,
  FolderSearch,
  Bookmark,
  Bell,
  Menu,
  X,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/terminal', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { href: '/terminal/search', label: 'Search', icon: <FolderSearch size={18} /> },
  { href: '/terminal/watchlist', label: 'Watchlist', icon: <Bookmark size={18} /> },
  { href: '/terminal/alerts', label: 'Alerts', icon: <Bell size={18} /> },
];

interface TerminalLayoutProps {
  children: React.ReactNode;
}

export default function TerminalLayout({ children }: TerminalLayoutProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLoader, setShowLoader] = useState(true);
  const [booted, setBooted] = useState(false);

  // Check if we've already booted this session
  useEffect(() => {
    const hasBooted = sessionStorage.getItem('clarp-terminal-booted');
    if (hasBooted) {
      setShowLoader(false);
      setBooted(true);
    }
  }, []);

  const handleBootComplete = () => {
    sessionStorage.setItem('clarp-terminal-booted', 'true');
    setShowLoader(false);
    setBooted(true);
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
      {/* Header */}
      <header className="shrink-0 border-b-2 border-ivory-light/10 bg-slate-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Back + Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/"
              className="flex items-center justify-center w-8 h-8 border border-ivory-light/20 text-ivory-light/50 hover:text-ivory-light hover:border-danger-orange hover:bg-danger-orange/10 transition-all"
              title="Back to home"
            >
              <ArrowLeft size={16} />
            </Link>
            <Link
              href="/terminal"
              className="flex items-center gap-2 text-ivory-light font-mono font-bold text-lg"
            >
              <span className="text-danger-orange">CLARP</span>
              <span className="text-ivory-light/60">TERMINAL</span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
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

          {/* Search - Desktop */}
          <div className="hidden lg:block flex-1 max-w-md">
            <SearchInput compact />
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
              <div className="border-t border-ivory-light/10 mt-2 pt-2">
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-4 py-3 font-mono text-sm text-ivory-light/50 hover:text-ivory-light"
                >
                  <span className="flex items-center gap-3">
                    <ArrowLeft size={18} />
                    Back to Home
                  </span>
                  <ChevronRight size={16} className="text-ivory-light/30" />
                </Link>
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
      <footer className="shrink-0 border-t border-ivory-light/10 py-6 px-4 sm:px-6 bg-slate-dark">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-ivory-light/40">
          <div className="flex items-center gap-2">
            <span className="text-danger-orange">CLARP</span>
            <span>Terminal v1.0</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-ivory-light/60 transition-colors">
              Home
            </Link>
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
          <span className="text-ivory-light/30">Not financial advice. DYOR.</span>
        </div>
      </footer>
    </div>
  );
}
