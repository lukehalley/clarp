import type { Metadata, Viewport } from 'next';
import { Analytics } from '@vercel/analytics/next';
import ClientLayout from '@/components/ClientLayout';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://clarp.lukehalley.com'),
  title: {
    default: 'Clarp - First Autonomous Trust Pilot',
    template: '%s | Clarp',
  },
  description: 'First autonomous trust pilot for crypto. Polymarket odds + on-chain analysis. CLARP spots LARP.',
  keywords: ['clarp', 'ai agent', 'crypto', 'solana', 'memecoin', 'polymarket', 'rug detection', 'trust pilot', 'on-chain analysis'],
  authors: [{ name: 'Clarp Team' }],
  creator: 'Clarp',
  publisher: 'Clarp',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'Clarp ($CLARP) - First Autonomous Trust Pilot',
    description: 'First autonomous trust pilot for crypto. Polymarket odds + on-chain analysis. CLARP spots LARP.',
    type: 'website',
    locale: 'en_US',
    url: 'https://clarp.lukehalley.com',
    siteName: 'Clarp',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Clarp - First autonomous trust pilot for crypto',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Clarp ($CLARP) - First Autonomous Trust Pilot',
    description: 'First autonomous trust pilot for crypto. Polymarket odds + on-chain analysis. CLARP spots LARP.',
    images: ['/og-image.png'],
    creator: '@clarp',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
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
      <body className="antialiased">
        <ClientLayout>
          {children}
        </ClientLayout>
        <Analytics />
      </body>
    </html>
  );
}
