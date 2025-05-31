import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Allow all HTTPS domains
      },
      {
        protocol: 'http',
        hostname: '**', // Allow all HTTP domains (for development)
      },
    ],
    // Alternative: if you want to be more specific, you can list exact domains
    // domains: ['example.com', 'cdn.example.com'],
  },
};

export default nextConfig;
