'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ClarpAI from '@/components/ClarpAI';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();
  const isTerminal = pathname?.startsWith('/terminal');

  return (
    <>
      {!isTerminal && <Navbar />}
      {children}
      {!isTerminal && <ClarpAI />}
    </>
  );
}
