import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@municipio/ui", "@municipio/config", "@municipio/datos"],
};

export default nextConfig;
