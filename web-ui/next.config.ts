import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["@anthropic-ai/claude-agent-sdk"],
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
