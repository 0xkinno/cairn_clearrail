import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pino", "pino-worker", "thread-stream"],
  turbopack: {},
};

export default nextConfig;
