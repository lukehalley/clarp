import TerminalLayout from '@/components/terminal/TerminalLayout';

export const metadata = {
  title: 'CLARP Terminal - Crypto Trust Intelligence',
  description: 'Real-time crypto trust intelligence. LARP score, evidence, and alerts. Avoid rugs before you ape.',
};

export default function TerminalRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TerminalLayout>{children}</TerminalLayout>;
}
