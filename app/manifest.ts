import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Clarp - First Autonomous Trust Pilot',
    short_name: 'Clarp',
    description: 'First autonomous trust pilot for crypto. Polymarket odds + on-chain analysis.',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
    icons: [
      {
        src: '/og-image.png',
        sizes: '400x400',
        type: 'image/png',
      },
    ],
  };
}
