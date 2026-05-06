import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  allowedDevOrigins: ['*', 'http://localhost:3000', 'http://[IP_ADDRESS]', 'http://192.168.68.117'],
};

export default nextConfig;
