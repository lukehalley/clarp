'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SearchInput from './SearchInput';
import ConnectWallet from '@/components/ConnectWallet';
import {
  Bookmark,
  Bell,
  Menu,
  X,
  ArrowLeft,
} from 'lucide-react';

interface TerminalLayoutProps {
  children: React.ReactNode;
}

export default function TerminalLayout({ children }: TerminalLayoutProps) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const handleBackToHome = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      router.push('/');
    }, 500);
  };

  return (
    <>
      {/* Persistent background */}
      <div className="fixed inset-0 bg-slate-dark -z-10" />
      <div className="min-h-screen bg-slate-dark flex flex-col">
        {/* Construction stripe */}
        <div className="construction-stripe h-2 shrink-0" />

        {/* Header */}
        <header className="shrink-0 border-b border-ivory-light/10 bg-slate-dark/95 backdrop-blur-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
            {/* Left: Back + Logo + Demo + Nav */}
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
            </div>

            {/* Search + Actions */}
            <div className="hidden md:flex items-center gap-3 flex-1 justify-end max-w-3xl">
              <div className="hidden lg:block flex-1 min-w-[400px]">
                <SearchInput compact />
              </div>

              {/* Watchlist Button - Disabled/Coming Soon */}
              <div
                className="shrink-0 w-10 h-10 flex items-center justify-center bg-larp-yellow/30 border-2 border-black/30 cursor-not-allowed opacity-40"
                title="Watchlist - Coming Soon"
              >
                <Bookmark size={18} className="text-black/50" />
              </div>

              {/* Alerts Icon - Disabled/Coming Soon */}
              <div className="relative shrink-0">
                <div
                  className="relative w-10 h-10 flex items-center justify-center bg-danger-orange/30 border-2 border-black/30 cursor-not-allowed opacity-40"
                  title="Alerts - Coming Soon"
                >
                  <Bell size={18} className="text-black/50" />
                </div>

              </div>

              {/* Connect Wallet */}
              <ConnectWallet compact />
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
              <div className="pb-4">
                {/* Mobile Action Buttons - Disabled/Coming Soon */}
                <div className="flex gap-3 px-4 py-3">
                  <div
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-larp-yellow/30 border-2 border-black/30 font-mono text-sm text-black/50 font-bold cursor-not-allowed opacity-40"
                  >
                    <Bookmark size={16} />
                    WATCHLIST
                  </div>
                  <div
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-danger-orange/30 border-2 border-black/30 font-mono text-sm text-black/50 font-bold cursor-not-allowed opacity-40"
                  >
                    <Bell size={16} />
                    ALERTS
                  </div>
                </div>
                {/* Mobile Wallet */}
                <div className="px-4 py-3 border-t border-ivory-light/10">
                  <ConnectWallet />
                </div>
                <div className="border-t border-ivory-light/10 mt-2 pt-2">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleBackToHome();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 font-mono text-sm text-ivory-light/50 hover:text-ivory-light cursor-pointer"
                  >
                    <ArrowLeft size={18} />
                    Back to Home
                  </button>
                </div>
              </div>
            </div>
          )}
        </header>

        {/* Search Bar - Mobile (below header) */}
        <div className="lg:hidden bg-slate-dark border-b border-ivory-light/10 p-4">
          <SearchInput />
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-x-hidden">
          {children}
        </main>

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
                <span className="text-larp-red">×</span> not financial advice. don&apos;t buy this.
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
    </>
  );
}
