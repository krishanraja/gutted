import type { NextConfig } from 'next'
import path from 'node:path'

const nextConfig: NextConfig = {
  // Pin the workspace root to this app so Turbopack does not walk up the tree and
  // adopt an ancestor lockfile (e.g. a stray C:\Users\krish\package-lock.json) as
  // the root, which breaks module resolution and the build.
  turbopack: {
    root: path.join(__dirname),
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'hzadscrqmyilbisexvyz.supabase.co' },
    ],
  },
  experimental: {
    serverActions: { bodySizeLimit: '10mb' },
  },
}

export default nextConfig
