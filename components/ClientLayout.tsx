'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ClarpAI from '@/components/ClarpAI';

// Context for page transition
interface TransitionContextType {
  navigateWithFade: (href: string) => void;
}

const TransitionContext = createContext<TransitionContextType | null>(null);

export function usePageTransition() {
  const context = useContext(TransitionContext);
  if (!context) {
    throw new Error('usePageTransition must be used within ClientLayout');
  }
  return context;
}

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isTerminal = pathname?.startsWith('/terminal');
  const [isFading, setIsFading] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  // Handle fade transition to terminal
  const navigateWithFade = useCallback((href: string) => {
    if (href.startsWith('/terminal')) {
      setIsFading(true);
      setPendingNavigation(href);
    } else {
      router.push(href);
    }
  }, [router]);

  // Complete navigation after fade
  useEffect(() => {
    if (isFading && pendingNavigation) {
      const timer = setTimeout(() => {
        router.push(pendingNavigation);
        // Keep fade overlay until terminal loader takes over
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isFading, pendingNavigation, router]);

  // Reset fade state when arriving at terminal
  useEffect(() => {
    if (isTerminal && isFading) {
      // Small delay to let terminal loader mount first
      const timer = setTimeout(() => {
        setIsFading(false);
        setPendingNavigation(null);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isTerminal, isFading]);

  return (
    <TransitionContext.Provider value={{ navigateWithFade }}>
      {!isTerminal && <Navbar />}
      {children}
      {!isTerminal && <ClarpAI />}

      {/* Fade to black overlay */}
      <div
        className={`fixed inset-0 bg-black z-[150] pointer-events-none transition-opacity duration-500 ${
          isFading ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </TransitionContext.Provider>
  );
}
