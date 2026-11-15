import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/vendor/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] }];
  },
  webpack: (config, { isServer, webpack }) => {
    // @gltf-transform ships a Node file helper that imports "node:fs"; in the browser it is never used
    if (!isServer) config.plugins.push(new webpack.NormalModuleReplacementPlugin(/^node:(fs|path)$/, (r) => { r.request = r.request.slice(5); }));
    config.resolve.alias = { ...config.resolve.alias, "@": root };
    config.resolve.fallback = { ...config.resolve.fallback, fs: false, path: false };
    return config;
  },
};
export default nextConfig;
