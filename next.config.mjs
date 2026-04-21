/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,

  async headers() {
    return [
      {
        // Apply to all routes
        source: '/(.*)',
        headers: [
          {
            // Required by PayPhone to verify the request origin
            // "origin" sends scheme+host without path — the recommended value per PayPhone docs
            key: 'Referrer-Policy',
            value: 'origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
