import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Clarp - AI Vaporware Generator',
    short_name: 'Clarp',
    description: 'The AI coding assistant that exclusively generates vaporware. Now shipping nothing to production.',
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
