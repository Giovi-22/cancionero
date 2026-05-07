import type { NextConfig } from "next";
import os from 'os';

// Obtener IPs locales automáticamente para evitar bloqueos de HMR
const getLocalIPs = () => {
  const interfaces = os.networkInterfaces();
  const ips = ['localhost:3000'];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push(`${iface.address}:3000`);
      }
    }
  }
  return ips;
};

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
  // @ts-ignore - Autorizar todas las IPs locales detectadas automáticamente
  allowedDevOrigins: getLocalIPs(),
};

export default nextConfig;
