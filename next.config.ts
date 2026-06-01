import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  logging: {
    fetches: {
      fullUrl: true,
    },
  },

  allowedDevOrigins: ['spookily-hatchet-dazzler.ngrok-free.dev'],
};

export default nextConfig;