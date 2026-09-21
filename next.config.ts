import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // CI runs `pnpm typecheck` as a dedicated, stricter verification step. The
  // sandboxed Next build worker cannot stream TypeScript diagnostics reliably.
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    // The CLI output stream is unavailable in some sandboxed build runners.
    // The compiler API performs the same validation without a child process.
    useTypeScriptCli: false,
    webpackBuildWorker: false,
  },
  webpack(config, { webpack }) {
    // Hugeicons 4.3.4 publishes six grid exports with a lower-case `x`, while
    // the package files use an upper-case `X`. Keep the preset-generated icon
    // imports intact and normalize only those broken dependency requests.
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /Grid([23])x([23])([^/]*)Icon\.js$/,
        (resource: { request: string }) => {
          resource.request = resource.request.replace(
            /Grid([23])x([23])([^/]*)Icon\.js$/,
            "Grid$1X$2$3Icon.js",
          );
        },
      ),
    );

    return config;
  },
};

export default nextConfig;
