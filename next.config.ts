import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  logging: {
    browserToTerminal: true,
  },
};

export default nextConfig;
