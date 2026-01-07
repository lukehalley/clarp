import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'Clarp',
  description: 'The AI coding assistant that exclusively generates vaporware. Now shipping nothing to production.',
  keywords: ['clarp', 'ai agent', 'satire', 'crypto', 'solana', 'memecoin', 'vaporware'],
  openGraph: {
    title: 'Clarp ($CLARP)',
    description: 'The AI coding assistant that exclusively generates vaporware.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Clarp ($CLARP)',
    description: 'The AI coding assistant that exclusively generates vaporware.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
