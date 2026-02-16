import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  serverExternalPackages: [
    "@opentelemetry/instrumentation-winston",
    "@opentelemetry/winston-transport",
    "@prisma/instrumentation",
  ],
  async redirects() {
    return [
      {
        source: "/",
        destination: "/workflows",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
