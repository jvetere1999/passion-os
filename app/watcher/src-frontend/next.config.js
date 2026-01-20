/** @type {import('next').NextConfig} */
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  output: 'export',
  basePath: '',
  assetPrefix: '',
  experimental: {
    optimizePackageImports: ["@radix-ui/react-dropdown-menu"],
  },
};

export default nextConfig;
