import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'C[LARP] AGENT',
  description: 'AI recognizes AI. Scan any GitHub repo and detect if it\'s vapourware.',
};

export default function ClarpAgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
