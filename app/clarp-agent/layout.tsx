import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'clarp snitch',
  description: 'AI recognizes AI. Scan any GitHub repo and detect if it\'s vapourware.',
};

export default function VapourwareDetectorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
