/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  swcMinify: true,
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  async rewrites() {
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.BACKEND_URL ||
      'http://localhost:5000';
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl.replace(/\/+$/, '')}/api/:path*`,
      },
      {
        source: '/admin/:path*',
        destination: `${backendUrl.replace(/\/+$/, '')}/admin/:path*`,
      },
      {
        source: '/admin',
        destination: `${backendUrl.replace(/\/+$/, '')}/admin`,
      },
    ];
  },
};

export default nextConfig;

