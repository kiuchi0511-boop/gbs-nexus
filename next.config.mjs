/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@react-pdf/renderer'],
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig
