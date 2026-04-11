

const nextConfig = {
  // Increase body size limit for image uploads (default is 1MB)
  experimental: {
    serverActions: {
      bodySizeLimit: '25mb',
    },
  },
}

export default nextConfig
