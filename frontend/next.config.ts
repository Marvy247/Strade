import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@stacks/connect', '@stacks/network', '@stacks/transactions', '@stacks/blockchain-api-client'],
  webpack: (config) => {
    config.externals = [...(config.externals || []), { 'node-fetch': 'fetch' }];
    return config;
  },
};

export default nextConfig;
