import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /** Prisma + node-pg 由 Node 运行时加载，避免被打进 Edge 包 */
  serverExternalPackages: ['@prisma/client', 'pg', '@prisma/adapter-pg'],
};

export default nextConfig;
