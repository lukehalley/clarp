/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  distDir: process.env.NODE_ENV === 'production' ? '.next' : '.next-dev',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pbs.twimg.com',
        pathname: '/profile_images/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: '/**',
      },
    ],
  },
}

module.exports = nextConfig
